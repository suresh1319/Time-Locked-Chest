import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Clock, TrendingUp } from 'lucide-react';
import { CONTRACTS } from '../config';
import { TIME_LOCKED_CHEST_ABI, TOKEN_SWAP_ABI } from '../contracts/abis';

export default function Transactions({ provider, refreshTrigger }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (provider) {
            loadRecentTransactions();
        }
    }, [provider, refreshTrigger]); // BUG-8: re-fetch on new stake/claim

    const loadRecentTransactions = async () => {
        try {
            setLoading(true);
            const contract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, provider);
            const swapContract = new ethers.Contract(CONTRACTS.TOKEN_SWAP, TOKEN_SWAP_ABI, provider);

            // Get recent blocks (last 1000 blocks or so)
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000);

            // Get LockCreated events
            const lockFilter = contract.filters.LockCreated();
            const lockEvents = await contract.queryFilter(lockFilter, fromBlock, currentBlock);

            // Get LockClaimed events
            const claimFilter = contract.filters.LockClaimed();
            const claimEvents = await contract.queryFilter(claimFilter, fromBlock, currentBlock);

            // Get TokensPurchased events
            const buyFilter = swapContract.filters.TokensPurchased();
            const buyEvents = await swapContract.queryFilter(buyFilter, fromBlock, currentBlock);

            // Get TokensSold events
            const sellFilter = swapContract.filters.TokensSold();
            const sellEvents = await swapContract.queryFilter(sellFilter, fromBlock, currentBlock);

            // Combine and sort by block number (most recent first)
            const allEvents = [...lockEvents, ...claimEvents, ...buyEvents, ...sellEvents]
                .sort((a, b) => b.blockNumber - a.blockNumber)
                .slice(0, 50); // Show last 50 transactions

            const txData = allEvents.map(event => {
                let type, user, amount;

                if (event.eventName === 'LockCreated') {
                    type = 'lock';
                    user = event.args.user;
                    amount = ethers.formatEther(event.args.amount);
                } else if (event.eventName === 'LockClaimed') {
                    type = 'claim';
                    user = event.args.user;
                    amount = ethers.formatEther(event.args.payout);
                } else if (event.eventName === 'TokensPurchased') {
                    type = 'buy';
                    user = event.args.buyer;
                    amount = ethers.formatEther(event.args.amountOfTokens);
                } else if (event.eventName === 'TokensSold') {
                    type = 'sell';
                    user = event.args.seller;
                    amount = ethers.formatEther(event.args.amountOfTokens);
                }

                return {
                    type,
                    user,
                    amount,
                    blockNumber: event.blockNumber,
                    txHash: event.transactionHash
                };
            });

            setTransactions(txData);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Recent Activity
                </h2>
                <p className="text-white/60 text-sm">Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={20} />
                Recent Activity
            </h2>

            {transactions.length === 0 ? (
                <p className="text-white/60 text-sm">No recent transactions</p>
            ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2">
                    {transactions.map((tx, index) => (
                        <div
                            key={index}
                            className="bg-white/5 rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'lock' ? 'bg-blue-500/20 text-blue-400' :
                                    tx.type === 'claim' ? 'bg-green-500/20 text-green-400' :
                                        tx.type === 'buy' ? 'bg-purple-500/20 text-purple-400' :
                                            'bg-orange-500/20 text-orange-400'
                                    }`}>
                                    {tx.type === 'lock' ? '🔒' : tx.type === 'claim' ? '🎁' : tx.type === 'buy' ? '🛒' : '💸'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm capitalize">
                                            {tx.type}
                                        </span>
                                        <span className="text-xs text-white/50">
                                            {tx.user.slice(0, 6)}...{tx.user.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-white/60">
                                        Block #{tx.blockNumber}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-sm">
                                    {parseFloat(tx.amount).toFixed(2)} SCAI
                                </div>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-treasure-400 hover:underline"
                                >
                                    View →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
