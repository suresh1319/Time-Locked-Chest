import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TrendingUp, Users, Coins } from 'lucide-react';
import { CONTRACTS } from '../config';
import { TIME_LOCKED_CHEST_ABI } from '../contracts/abis';

export default function Statistics({ provider, account, refreshTrigger }) {
    const [stats, setStats] = useState({
        totalLocked: '0',
        totalPaidOut: '0',
        userLocked: '0',
        userPaidOut: '0'
    });

    useEffect(() => {
        if (provider) {
            loadStats();
            const interval = setInterval(loadStats, 30000);
            return () => clearInterval(interval);
        }
    }, [provider, account, refreshTrigger]);

    const loadStats = async () => {
        try {
            const chestContract = new ethers.Contract(
                CONTRACTS.TIME_LOCKED_CHEST,
                TIME_LOCKED_CHEST_ABI,
                provider
            );

            const [activeLocked, totalPaidOut] = await Promise.all([
                chestContract.activeLocked(),
                chestContract.totalPaidOut()
            ]);

            let userLocked = BigInt(0);
            let userPaidOut = BigInt(0);

            if (account) {
                try {
                    const userLocks = await chestContract.getUserLocks(account);
                    for (const lock of userLocks) {
                        if (!lock.claimed) {
                            userLocked += BigInt(lock.amount);
                        }
                    }

                    // For the total paid out, we find all LockClaimed events for this user.
                    // To handle public RPC block limits, we will query from a reasonable range.
                    const currentBlock = await provider.getBlockNumber();
                    // Let's assume the contract was deployed in the last ~50,000 blocks
                    const fromBlock = Math.max(0, currentBlock - 50000);

                    const claimFilter = chestContract.filters.LockClaimed(account);
                    const claimEvents = await chestContract.queryFilter(claimFilter, fromBlock, currentBlock);

                    for (const event of claimEvents) {
                        userPaidOut += BigInt(event.args.payout);
                    }
                } catch (e) {
                    console.error("Error fetching user stats:", e);
                }
            }

            setStats({
                totalLocked: ethers.formatEther(activeLocked),
                totalPaidOut: ethers.formatEther(totalPaidOut),
                userLocked: ethers.formatEther(userLocked),
                userPaidOut: ethers.formatEther(userPaidOut)
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card h-full flex items-center">
                <div className="flex items-center gap-4 w-full h-full">
                    <div className="bg-blue-500/20 p-4 rounded-lg shrink-0">
                        <Coins className="text-blue-400" size={32} />
                    </div>
                    <div className="flex flex-col justify-between flex-1 h-full py-1">
                        <div>
                            <p className="text-sm font-medium text-white/60">Global Active Locked</p>
                            <p className="text-2xl font-bold">{parseFloat(stats.totalLocked).toFixed(0)} SCAI</p>
                        </div>
                        {account && (
                            <div className="pt-3 mt-3 border-t border-white/10 w-full">
                                <p className="text-sm font-medium text-white/60">Your Active Locked</p>
                                <p className="text-lg font-bold text-blue-400">{parseFloat(stats.userLocked).toFixed(0)} SCAI</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card h-full flex items-center">
                <div className="flex items-center gap-4 w-full h-full">
                    <div className="bg-green-500/20 p-4 rounded-lg shrink-0">
                        <TrendingUp className="text-green-400" size={32} />
                    </div>
                    <div className="flex flex-col justify-between flex-1 h-full py-1">
                        <div>
                            <p className="text-sm font-medium text-white/60">Global Total Paid Out</p>
                            <p className="text-2xl font-bold">{parseFloat(stats.totalPaidOut).toFixed(0)} SCAI</p>
                        </div>
                        {account && (
                            <div className="pt-3 mt-3 border-t border-white/10 w-full">
                                <p className="text-sm font-medium text-white/60">Your Total Paid Out</p>
                                <p className="text-lg font-bold text-green-400">{parseFloat(stats.userPaidOut).toFixed(0)} SCAI</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
