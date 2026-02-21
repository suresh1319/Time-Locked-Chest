import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Lock, TrendingUp, Shield, Zap } from 'lucide-react';
import { CONTRACTS, DURATIONS } from '../config';
import { SCAI_TOKEN_ABI, TIME_LOCKED_CHEST_ABI } from '../contracts/abis';

export default function StakeForm({ provider, account, onStakeSuccess, refreshTrigger }) {
    const [amount, setAmount] = useState('');
    const [duration, setDuration] = useState(DURATIONS.ONE_HOUR.value);
    const [balance, setBalance] = useState('0');
    const [allowance, setAllowance] = useState('0');
    const [approving, setApproving] = useState(false);
    const [staking, setStaking] = useState(false);
    const [guarantee, setGuarantee] = useState(30);
    const [minStakeAmount, setMinStakeAmount] = useState('1');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (provider && account) {
            loadBalanceAndAllowance();
        }
    }, [provider, account, refreshTrigger]);

    useEffect(() => {
        if (amount) {
            calculateGuarantee();
        }
    }, [amount, duration]);

    const loadBalanceAndAllowance = async () => {
        try {
            setLoading(true);
            const signer = await provider.getSigner();
            const tokenContract = new ethers.Contract(CONTRACTS.SCAI_TOKEN, SCAI_TOKEN_ABI, signer);

            const bal = await tokenContract.balanceOf(account);
            const allow = await tokenContract.allowance(account, CONTRACTS.TIME_LOCKED_CHEST);

            // Try to fetch minStake
            try {
                const chestContract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, provider);
                const min = await chestContract.minStake();
                setMinStakeAmount(ethers.formatEther(min));
            } catch (e) {
                console.log("Could not fetch minStake", e);
            }

            setBalance(ethers.formatEther(bal));
            setAllowance(ethers.formatEther(allow));
        } catch (error) {
            console.error('Error loading balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateGuarantee = () => {
        const amountNum = parseFloat(amount || 0);
        let baseGuarantee = 20; // V2: 20% for 1 hour

        if (duration === DURATIONS.SIX_HOURS.value) {
            baseGuarantee = 35; // V2: 35% for 6 hours
        } else if (duration === DURATIONS.TWENTY_FOUR_HOURS.value) {
            baseGuarantee = 45; // V2: 45% for 24 hours
        }

        // V2 Amount Bonus: Asymptotic Curve
        // Formula: Bonus = MaxBonus * (Amount / (Amount + k))
        // MaxBonus = 30%, k = 2000
        let bonus = 0;
        if (amountNum > 0) {
            bonus = 30 * (amountNum / (amountNum + 2000));
        }

        // V2 Hard Cap: 80%
        const totalGuarantee = Math.min(80, baseGuarantee + bonus);
        setGuarantee(Math.floor(totalGuarantee));
    };

    const handleApprove = async () => {
        try {
            setApproving(true);
            const signer = await provider.getSigner();
            const tokenContract = new ethers.Contract(CONTRACTS.SCAI_TOKEN, SCAI_TOKEN_ABI, signer);

            const amountToApprove = ethers.parseEther(amount);
            const tx = await tokenContract.approve(CONTRACTS.TIME_LOCKED_CHEST, amountToApprove);
            await tx.wait();

            await loadBalanceAndAllowance();
            alert('✅ Token approval successful!');
        } catch (error) {
            console.error('Approval error:', error);
            alert('❌ Approval failed: ' + error.message);
        } finally {
            setApproving(false);
        }
    };

    const handleStake = async () => {
        try {
            setStaking(true);
            const signer = await provider.getSigner();
            const tokenContract = new ethers.Contract(CONTRACTS.SCAI_TOKEN, SCAI_TOKEN_ABI, signer);
            const chestContract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, signer);

            const amountToStake = ethers.parseEther(amount);

            // Pre-flight checks before sending the transaction
            const currentAllowance = await tokenContract.allowance(account, CONTRACTS.TIME_LOCKED_CHEST);
            if (currentAllowance < amountToStake) {
                alert('❌ Insufficient allowance. Please click "Approve" first to allow the contract to spend your tokens.');
                await loadBalanceAndAllowance();
                return;
            }

            const userBalance = await tokenContract.balanceOf(account);
            if (userBalance < amountToStake) {
                alert(`❌ Insufficient balance. You have ${ethers.formatEther(userBalance)} SCAI but tried to lock ${amount} SCAI.`);
                return;
            }

            const tx = await chestContract.lock(amountToStake, duration);
            await tx.wait();

            await loadBalanceAndAllowance();
            setAmount('');
            alert('🎉 Tokens locked successfully!');
            if (onStakeSuccess) onStakeSuccess();
        } catch (error) {
            console.error('Staking error:', error);
            // Parse common revert reasons into friendly messages
            const msg = error?.reason || error?.message || '';
            if (msg.includes('Amount below minimum stake')) {
                alert(`❌ Amount too small. Minimum stake is ${minStakeAmount} SCAI.`);
            } else if (msg.includes('Invalid duration')) {
                alert('❌ Invalid lock duration selected.');
            } else if (msg.includes('Insufficient treasury balance')) {
                alert('❌ The treasury does not have enough tokens to cover your potential payout. Please try a smaller amount.');
            } else if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
                alert('❌ Transaction rejected by user.');
            } else {
                // Try to extract the execution reverted message
                const match = msg.match(/execution reverted: "([^"]+)"/);
                if (match && match[1]) {
                    alert('❌ Staking failed: ' + match[1]);
                } else {
                    alert('❌ Staking failed: ' + (error?.shortMessage || error?.reason || 'Unknown error'));
                }
            }
        } finally {
            setStaking(false);
        }
    };

    // BUG-6: Use BigInt comparison to avoid float precision issues and NaN from empty string.
    const needsApproval = !amount
        ? false
        : ethers.parseEther(amount || '0') > ethers.parseEther(allowance || '0');

    const selectedDuration = Object.values(DURATIONS).find(d => d.value === duration);

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-treasure-500/20 p-3 rounded-lg">
                    <Lock className="text-treasure-400" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Lock Tokens (V2)</h2>
                    <p className="text-white/60 text-sm">Stake SCAI for guaranteed rewards + risk bonus</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-treasure-500"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Balance */}
                    <div className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-white/60">Your Balance</p>
                            <p className="text-2xl font-bold text-treasure-400">{parseFloat(balance).toFixed(2)} SCAI</p>
                        </div>
                    </div>


                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Amount to Lock</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="input-field w-full"
                                min={minStakeAmount}
                                step="0.01"
                            />
                            <button
                                onClick={() => setAmount(balance)}
                                title="⚠️ This will lock your entire SCAI balance"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-treasure-400 text-sm font-semibold hover:text-treasure-300"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {/* Duration Selection */}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Lock Duration</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.values(DURATIONS).map((dur) => (
                                <button
                                    key={dur.value}
                                    onClick={() => setDuration(dur.value)}
                                    className={`p-3 rounded-lg border-2 transition-all ${duration === dur.value
                                        ? 'border-treasure-500 bg-treasure-500/20'
                                        : 'border-white/20 bg-white/5 hover:border-white/40'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{dur.emoji}</div>
                                    <div className="text-sm font-semibold">{dur.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Preview */}
                    {amount && parseFloat(amount) > 0 && (
                        <div className="bg-gradient-to-br from-treasure-500/20 to-purple-500/20 rounded-lg p-4 border border-treasure-500/30">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="text-green-400" size={16} />
                                        <span className="text-xs text-white/60">Guaranteed</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-400">{guarantee}%</p>
                                    <p className="text-xs text-white/60">{(parseFloat(amount) * guarantee / 100).toFixed(2)} SCAI</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="text-yellow-400" size={16} />
                                        <span className="text-xs text-white/60">Risk Portion</span>
                                    </div>
                                    <p className="text-lg font-bold text-yellow-400">{100 - guarantee}%</p>
                                    <p className="text-xs text-white/60">{(parseFloat(amount) * (100 - guarantee) / 100).toFixed(2)} SCAI</p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-white/60 mb-1">Potential Payout Range</p>
                                <p className="text-sm">
                                    <span className="text-red-400 font-semibold">
                                        {/* BUG-7: Multiply by 0.98 to show actual after-fee payout */}
                                        {(parseFloat(amount) * (guarantee / 100 + (100 - guarantee) / 100 * 0.5) * 0.98).toFixed(2)}
                                    </span>
                                    <span className="text-white/60 mx-2">→</span>
                                    <span className="text-green-400 font-semibold">
                                        {(parseFloat(amount) * (guarantee / 100 + (100 - guarantee) / 100 * 5.0) * 0.98).toFixed(2)} SCAI
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {needsApproval ? (
                        <button
                            onClick={handleApprove}
                            disabled={approving || !amount || parseFloat(amount) <= 0}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {approving && (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            )}
                            {approving ? 'Approving...' : `Approve ${amount || '0'} SCAI`}
                        </button>
                    ) : (
                        <button
                            onClick={handleStake}
                            disabled={staking || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {staking ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Lock size={20} />
                            )}
                            {staking ? 'Locking...' : `Lock ${amount || '0'} SCAI for ${selectedDuration?.label}`}
                        </button>
                    )}
                </div>
            )
            }
        </div >
    );
}
