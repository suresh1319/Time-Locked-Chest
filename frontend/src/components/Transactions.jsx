import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Clock, TrendingUp } from 'lucide-react';
import { CONTRACTS } from '../config';
import { TIME_LOCKED_CHEST_ABI } from '../contracts/abis';

export default function Transactions({ provider }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (provider) {
            loadRecentTransactions();
        }
    }, [provider]);

    const loadRecentTransactions = async () => {
        try {
            setLoading(true);
            const contract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, provider);

            // Get recent blocks (last 1000 blocks or so)
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000);

            // Get LockCreated events
            const lockFilter = contract.filters.LockCreated();
            const lockEvents = await contract.queryFilter(lockFilter, fromBlock, currentBlock);

            // Get LockClaimed events
            const claimFilter = contract.filters.LockClaimed();
            const claimEvents = await contract.queryFilter(claimFilter, fromBlock, currentBlock);

            // Combine and sort by block number (most recent first)
            const allEvents = [...lockEvents, ...claimEvents]
                .sort((a, b) => b.blockNumber - a.blockNumber)
                .slice(0, 10); // Show only last 10 transactions

            const txData = allEvents.map(event => {
                const isLock = event.eventName === 'LockCreated';
                return {
                    type: isLock ? 'lock' : 'claim',
                    user: event.args.user,
                    amount: ethers.formatEther(isLock ? event.args.amount : event.args.payout),
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
                <div className="space-y-2">
                    {transactions.map((tx, index) => (
                        <div
                            key={index}
                            className="bg-white/5 rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'lock'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {tx.type === 'lock' ? '🔒' : '🎁'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">
                                            {tx.type === 'lock' ? 'Lock' : 'Claim'}
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
