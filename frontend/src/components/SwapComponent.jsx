import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { RefreshCw, ArrowRight, ArrowDownUp } from 'lucide-react';
import { CONTRACTS } from '../config';
import { TOKEN_SWAP_ABI, SCAI_TOKEN_ABI } from '../contracts/abis';

export default function SwapComponent({ provider, account, onSwapSuccess }) {
    const [mode, setMode] = useState('buy'); // 'buy' or 'sell'
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [rate, setRate] = useState(100000n); // Default 100000 SCAI per ETH
    const [fee, setFee] = useState(10n); // Default 10% fee
    const [scaiBalance, setScaiBalance] = useState('0');
    const [ethBalance, setEthBalance] = useState('0');

    useEffect(() => {
        if (provider && account) {
            fetchData();
        }
    }, [provider, account]);

    const fetchData = async () => {
        if (!CONTRACTS.TOKEN_SWAP) return;

        try {
            const signer = await provider.getSigner();
            const swapContract = new ethers.Contract(CONTRACTS.TOKEN_SWAP, TOKEN_SWAP_ABI, provider);
            const tokenContract = new ethers.Contract(CONTRACTS.SCAI_TOKEN, SCAI_TOKEN_ABI, provider);

            const [r, f, uBal, uEth] = await Promise.all([
                swapContract.rate(),
                swapContract.sellFeePercentage(),
                tokenContract.balanceOf(account),
                provider.getBalance(account)
            ]);

            setRate(r);
            setFee(f);
            setScaiBalance(ethers.formatEther(uBal));
            setEthBalance(ethers.formatEther(uEth));
        } catch (error) {
            console.error("Error fetching swap data:", error);
        }
    };

    const handleSwap = async () => {
        if (!amount || !CONTRACTS.TOKEN_SWAP) return;

        // BUG-12: Pre-flight check: abort before wallet prompt if sell amount too small.
        if (mode === 'sell') {
            const ethOut = parseFloat(amount) / Number(rate);
            if (ethOut < 1e-9) {
                alert('Amount too small — would result in 0 ETH output. Please enter a larger amount.');
                return;
            }
        }

        setLoading(true);

        try {
            const signer = await provider.getSigner();
            const swapContract = new ethers.Contract(CONTRACTS.TOKEN_SWAP, TOKEN_SWAP_ABI, signer);
            const tokenContract = new ethers.Contract(CONTRACTS.SCAI_TOKEN, SCAI_TOKEN_ABI, signer);

            let tx;
            if (mode === 'buy') {
                const value = ethers.parseEther(amount);
                tx = await swapContract.buyTokens({ value });
            } else {
                const tokenAmount = ethers.parseEther(amount);
                // Approve first
                const approveTx = await tokenContract.approve(CONTRACTS.TOKEN_SWAP, tokenAmount);
                await approveTx.wait();

                // Sell
                tx = await swapContract.sellTokens(tokenAmount);
            }

            await tx.wait();
            setAmount('');
            fetchData();
            if (onSwapSuccess) onSwapSuccess();
            alert('Swap successful!');
        } catch (error) {
            console.error("Swap failed:", error);
            const msg = error?.reason || error?.data?.message || error?.message || '';
            const match = msg.match(/execution reverted: "([^"]+)"/);

            if (match && match[1]) {
                alert('❌ Swap failed: ' + match[1]);
            } else if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
                alert('❌ Transaction rejected by user.');
            } else if (msg.includes('execution reverted:')) {
                const cleanMsg = msg.substring(msg.indexOf('execution reverted:') + 19).split(',')[0].replace(/"/g, '').trim();
                alert('❌ Swap failed: ' + cleanMsg);
            } else {
                alert('❌ Swap failed: ' + (error?.shortMessage || error?.reason || 'Unknown error'));
            }
        } finally {
            setLoading(false);
        }
    };

    const estimatedOutput = () => {
        if (!amount || isNaN(amount)) return '0';
        try {
            if (mode === 'buy') {
                return (parseFloat(amount) * Number(rate)).toFixed(2);
            } else {
                const ethVal = parseFloat(amount) / Number(rate);
                const feeVal = ethVal * (Number(fee) / 100);
                return (ethVal - feeVal).toFixed(4);
            }
        } catch (e) {
            return '0';
        }
    };

    return (
        <div className="card max-w-md mx-auto relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <RefreshCw size={100} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ArrowDownUp className="text-treasure-400" />
                        Token Swap
                    </h2>
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setMode('buy')}
                            className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${mode === 'buy' ? 'bg-treasure-500 text-white shadow-lg' : 'text-white/60 hover:text-white'
                                }`}
                        >
                            Buy
                        </button>
                        <button
                            onClick={() => setMode('sell')}
                            className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${mode === 'sell' ? 'bg-treasure-500 text-white shadow-lg' : 'text-white/60 hover:text-white'
                                }`}
                        >
                            Sell
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Input */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex justify-between">
                            <span>You Pay</span>
                            <span>Balance: {mode === 'buy' ? parseFloat(ethBalance).toFixed(4) + ' ETH' : parseFloat(scaiBalance).toFixed(2) + ' SCAI'}</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.0"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-20 text-lg font-mono focus:outline-none focus:border-treasure-400/50 transition-colors"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-white/40">
                                {mode === 'buy' ? 'ETH' : 'SCAI'}
                            </div>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                        <div className="bg-white/5 rounded-full p-2">
                            <ArrowRight size={20} className="text-white/40" />
                        </div>
                    </div>

                    {/* Output */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2">You Receive (Estimated)</label>
                        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-lg font-mono text-treasure-400">{estimatedOutput()}</span>
                            <span className="font-bold text-white/40">{mode === 'buy' ? 'SCAI' : 'ETH'}</span>
                        </div>
                        {mode === 'sell' && (
                            <p className="text-xs text-white/40 mt-1 text-right">Includes {fee.toString()}% fee</p>
                        )}
                    </div>

                    <button
                        onClick={handleSwap}
                        disabled={loading || !amount}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <RefreshCw size={18} />
                        )}
                        {loading ? 'Swapping...' : `Swap ${mode === 'buy' ? 'ETH to SCAI' : 'SCAI to ETH'}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
