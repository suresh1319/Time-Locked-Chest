import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Unlock, Clock, TrendingUp, Gift } from 'lucide-react';
import { CONTRACTS, DURATIONS } from '../config';
import { TIME_LOCKED_CHEST_ABI } from '../contracts/abis';

export default function ChestsList({ provider, account, refreshTrigger }) {
    const [chests, setChests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState({});


    useEffect(() => {
        if (provider && account) {
            loadChests();
        }
    }, [provider, account, refreshTrigger]);

    const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now() / 1000);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            if (provider && account) {
                loadChests();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [provider, account]);

    const loadChests = async () => {
        try {
            setLoading(true);
            const signer = await provider.getSigner();
            const chestContract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, signer);

            const locks = await chestContract.getUserLocks(account);

            // Calculate additional data for each chest
            const chestsWithData = await Promise.all(
                locks.map(async (lock, index) => {
                    const preview = await chestContract.previewPayout(account, index);
                    const actualPayout = await chestContract.calculatePayout(account, index);

                    return {
                        index,
                        amount: ethers.formatEther(lock.amount),
                        duration: Number(lock.duration),
                        lockTime: Number(lock.lockTime),
                        claimed: lock.claimed,
                        randomSeed: lock.randomSeed.toString(),
                        guaranteedAmount: ethers.formatEther(preview.guaranteedAmount),
                        minPayout: ethers.formatEther(preview.minPayout),
                        maxPayout: ethers.formatEther(preview.maxPayout),
                        actualPayout: ethers.formatEther(actualPayout),
                    };
                })
            );

            setChests(chestsWithData.reverse());
        } catch (error) {
            console.error('Error loading chests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (index) => {
        try {
            setClaiming({ ...claiming, [index]: true });
            const signer = await provider.getSigner();
            const chestContract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, signer);

            const tx = await chestContract.claim(index);
            await tx.wait();

            alert('🎉 Rewards claimed successfully!');
            await loadChests();
        } catch (error) {
            console.error('Claim error:', error);
            const msg = error?.reason || error?.data?.message || error?.message || '';
            const match = msg.match(/execution reverted: "([^"]+)"/);

            if (match && match[1]) {
                alert('❌ Claim failed: ' + match[1]);
            } else if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
                alert('❌ Transaction rejected by user.');
            } else if (msg.includes('execution reverted:')) {
                const cleanMsg = msg.substring(msg.indexOf('execution reverted:') + 19).split(',')[0].replace(/"/g, '').trim();
                alert('❌ Claim failed: ' + cleanMsg);
            } else {
                alert('❌ Claim failed: ' + (error?.shortMessage || error?.reason || 'Unknown error'));
            }
        } finally {
            setClaiming({ ...claiming, [index]: false });
        }
    };

    const getTimeRemaining = (lockTime, duration) => {
        const unlockTime = lockTime + duration;
        const remaining = unlockTime - currentTime;

        if (remaining <= 0) return 'Unlocked!';

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = Math.floor(remaining % 60);

        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const isUnlocked = (lockTime, duration) => {
        const unlockTime = lockTime + duration;
        return currentTime >= unlockTime;
    };

    const getDurationLabel = (duration) => {
        const dur = Object.values(DURATIONS).find(d => d.value === duration);
        return dur ? `${dur.emoji} ${dur.label}` : `${duration}s`;
    };

    if (loading) {
        return (
            <div className="card h-full flex flex-col justify-center items-center text-center py-12">
                <h2 className="text-2xl font-bold mb-6">Your Treasure Chests</h2>
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-treasure-500"></div>
                    <p className="text-white/60 mt-4">Loading your chests...</p>
                </div>
            </div>
        );
    }

    if (chests.length === 0) {
        return (
            <div className="card h-full flex flex-col justify-center items-center text-center py-12">
                <div className="text-6xl mb-4">🏺</div>
                <h3 className="text-xl font-semibold mb-2">No Active Chests</h3>
                <p className="text-white/60">Lock some tokens to create your first treasure chest!</p>
            </div>
        );
    }

    return (
        <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-2xl font-bold">Your Treasure Chests</h2>
                <span className="bg-treasure-500/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {chests.filter(c => !c.claimed).length} Active
                </span>
            </div>

            <div className="space-y-4 max-h-[250px] lg:max-h-none overflow-y-auto pr-2 flex-1 relative">
                {chests.map((chest) => {
                    const unlocked = isUnlocked(chest.lockTime, chest.duration);
                    const timeRemaining = getTimeRemaining(chest.lockTime, chest.duration);

                    return (
                        <div
                            key={chest.index}
                            className={`border-2 rounded-xl p-4 transition-all ${chest.claimed
                                ? 'border-white/10 bg-white/5 opacity-60'
                                : unlocked
                                    ? 'border-green-500/50 bg-green-500/10 shimmer-effect'
                                    : 'border-treasure-500/30 bg-gradient-to-br from-treasure-500/10 to-purple-500/10'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-3xl">
                                            {chest.claimed ? '📦' : unlocked ? '✨' : '🔒'}
                                        </span>
                                        <div>
                                            <p className="font-bold text-lg">Chest #{chest.index}</p>
                                            <p className="text-sm text-white/60">{getDurationLabel(chest.duration)}</p>
                                        </div>
                                    </div>
                                </div>
                                {chest.claimed ? (
                                    <span className="bg-gray-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                                        Claimed
                                    </span>
                                ) : unlocked ? (
                                    <span className="bg-green-500/20 px-3 py-1 rounded-full text-xs font-semibold text-green-400 animate-pulse">
                                        Ready to Claim!
                                    </span>
                                ) : (
                                    <span className="bg-treasure-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <Clock size={12} />
                                        {timeRemaining}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="bg-white/5 rounded-lg p-2">
                                    <p className="text-xs text-white/60 mb-1">Staked</p>
                                    <p className="font-bold">{parseFloat(chest.amount).toFixed(2)} SCAI</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-2">
                                    <p className="text-xs text-white/60 mb-1">Payout</p>
                                    <p className="font-bold text-treasure-400">
                                        {chest.claimed || unlocked ? `${parseFloat(chest.actualPayout).toFixed(2)} SCAI` : '???'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-2 mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={14} className="text-treasure-400" />
                                    <span className="text-xs font-semibold">Reward Breakdown</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-white/60">Guaranteed</p>
                                        <p className="font-semibold text-green-400">{parseFloat(chest.guaranteedAmount).toFixed(2)} SCAI</p>
                                    </div>
                                    <div>
                                        <p className="text-white/60">Risk Bonus</p>
                                        <p className="font-semibold text-yellow-400">
                                            {chest.claimed || unlocked ? `${(parseFloat(chest.actualPayout) - parseFloat(chest.guaranteedAmount)).toFixed(2)} SCAI` : '???'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!chest.claimed && unlocked && (
                                <button
                                    onClick={() => handleClaim(chest.index)}
                                    disabled={claiming[chest.index]}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {claiming[chest.index] ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <Gift size={18} />
                                    )}
                                    {claiming[chest.index] ? 'Claiming...' : `Claim ${parseFloat(chest.actualPayout).toFixed(2)} SCAI`}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
