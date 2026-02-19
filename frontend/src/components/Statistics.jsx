import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TrendingUp, Users, Coins } from 'lucide-react';
import { CONTRACTS } from '../config';
import { TIME_LOCKED_CHEST_ABI } from '../contracts/abis';

export default function Statistics({ provider, refreshTrigger }) { // account prop intentionally omitted (global stats only)
    const [stats, setStats] = useState({
        totalLocked: '0',
        totalPaidOut: '0'
    });

    useEffect(() => {
        if (provider) {
            loadStats();
            const interval = setInterval(loadStats, 30000);
            return () => clearInterval(interval);
        }
    }, [provider, refreshTrigger]);

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

            setStats({
                totalLocked: ethers.formatEther(activeLocked),
                totalPaidOut: ethers.formatEther(totalPaidOut)
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                        <Coins className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-white/60">Active Locked</p>
                        <p className="text-xl font-bold">{parseFloat(stats.totalLocked).toFixed(0)} SCAI</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-3 rounded-lg">
                        <TrendingUp className="text-green-400" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-white/60">Total Paid Out</p>
                        <p className="text-xl font-bold">{parseFloat(stats.totalPaidOut).toFixed(0)} SCAI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
