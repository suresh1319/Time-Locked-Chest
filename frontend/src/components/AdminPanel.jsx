import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Settings, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { CONTRACTS } from '../config';
import { TIME_LOCKED_CHEST_ABI, SCAI_TOKEN_ABI } from '../contracts/abis';

export default function AdminPanel({ provider, account, refreshTrigger }) {
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Current values
    const [currentMinStake, setCurrentMinStake] = useState('0');
    const [currentFee, setCurrentFee] = useState('0');
    const [currentMinSellAmount, setCurrentMinSellAmount] = useState('0');
    const [tokenSwapEthBalance, setTokenSwapEthBalance] = useState('0');
    const [tokenSwapScaiBalance, setTokenSwapScaiBalance] = useState('0');

    // Input values
    const [newMinStake, setNewMinStake] = useState('');
    const [newFee, setNewFee] = useState('');
    const [newMinSellAmount, setNewMinSellAmount] = useState('');

    // Treasury Stats
    const [treasuryBalance, setTreasuryBalance] = useState('0');
    const [totalLocked, setTotalLocked] = useState('0');

    useEffect(() => {
        if (provider && account) {
            checkOwnership();
            loadCurrentValues();
        }
    }, [provider, account, refreshTrigger]);

    const checkOwnership = async () => {
        try {
            setLoading(true);
            const contract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, provider);
            const owner = await contract.owner();
            setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (error) {
            console.error('Error checking ownership:', error);
            setIsOwner(false);
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentValues = async () => {
        try {
            const chestContract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, provider);
            // Need ABI for TokenSwap for minSellAmount
            const swapAbi = ['function minSellAmount() view returns (uint256)'];
            const swapContract = new ethers.Contract(CONTRACTS.TOKEN_SWAP, swapAbi, provider);
            const tokenContract = new ethers.Contract(CONTRACTS.SCAI_TOKEN, SCAI_TOKEN_ABI, provider);

            const [minStake, fee, minSellAmount, tokenSwapEthBalanceRaw, treasuryBal, activeLocked, swapScaiBal] = await Promise.all([
                chestContract.minStake(),
                chestContract.fee(),
                swapContract.minSellAmount(),
                provider.getBalance(CONTRACTS.TOKEN_SWAP),
                chestContract.getTreasuryBalance(),
                chestContract.activeLocked(),
                tokenContract.balanceOf(CONTRACTS.TOKEN_SWAP)
            ]);

            setCurrentMinStake(ethers.formatEther(minStake));
            setCurrentFee(fee.toString());
            setCurrentMinSellAmount(ethers.formatEther(minSellAmount));
            setTokenSwapEthBalance(ethers.formatEther(tokenSwapEthBalanceRaw));
            setTokenSwapScaiBalance(ethers.formatEther(swapScaiBal));
            setTreasuryBalance(ethers.formatEther(treasuryBal));
            setTotalLocked(ethers.formatEther(activeLocked));
        } catch (error) {
            console.error('Error loading current values:', error);
        }
    };

    const handleSetMinStake = async () => {
        if (!newMinStake) return;

        try {
            setSubmitting(true);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, signer);

            const tx = await contract.setMinStake(ethers.parseEther(newMinStake));
            await tx.wait();

            await loadCurrentValues();
            setNewMinStake('');
            alert('✅ Min Stake updated successfully!');
        } catch (error) {
            console.error('Error setting min stake:', error);
            alert('❌ Failed: ' + (error.reason || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetFee = async () => {
        if (!newFee) return;

        try {
            setSubmitting(true);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACTS.TIME_LOCKED_CHEST, TIME_LOCKED_CHEST_ABI, signer);

            const tx = await contract.setFee(parseInt(newFee));
            await tx.wait();

            await loadCurrentValues();
            setNewFee('');
            alert('✅ Fee updated successfully!');
        } catch (error) {
            console.error('Error setting fee:', error);
            alert('❌ Failed: ' + (error.reason || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetMinSellAmount = async () => {
        if (!newMinSellAmount) return;

        try {
            setSubmitting(true);
            const signer = await provider.getSigner();
            const swapAbi = ['function setMinSellAmount(uint256 _newMin)'];
            const swapContract = new ethers.Contract(CONTRACTS.TOKEN_SWAP, swapAbi, signer);

            const tx = await swapContract.setMinSellAmount(ethers.parseEther(newMinSellAmount));
            await tx.wait();

            await loadCurrentValues();
            setNewMinSellAmount('');
            alert('✅ Min Sell Amount updated successfully!');
        } catch (error) {
            console.error('Error setting min sell amount:', error);
            alert('❌ Failed: ' + (error.reason || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const getHealthStatus = () => {
        const locked = parseFloat(totalLocked);
        const treasury = parseFloat(treasuryBalance);

        if (locked === 0) return { label: 'Safe', color: 'text-green-400', icon: '🟢' };

        const ratio = treasury / locked;

        if (ratio >= 2.0) return { label: 'Very Healthy', color: 'text-green-400', icon: '🟢' };
        if (ratio >= 1.5) return { label: 'Stable', color: 'text-yellow-400', icon: '🟡' };
        if (ratio >= 1.1) return { label: 'Low Reserves', color: 'text-orange-400', icon: '🟠' };
        return { label: 'At Risk', color: 'text-red-400', icon: '🔴' };
    };

    if (loading) {
        return null;
    }

    if (!isOwner) {
        return null;
    }

    const health = getHealthStatus();

    return (
        <div className="card bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Shield className="text-orange-400" size={20} />
                    <h2 className="text-xl font-bold transition-colors hover:text-orange-400">Admin Panel</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs bg-orange-500/20 px-3 py-1 rounded-full text-orange-400 font-semibold">
                        Owner Access
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-white/60" /> : <ChevronDown size={20} className="text-white/60" />}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-orange-500/20">
                    {/* Treasury Health Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-orange-500/20">
                        <div className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/60">Treasury Balance</p>
                                <p className="text-2xl font-bold text-treasure-400">{parseFloat(treasuryBalance).toFixed(0)} SCAI</p>
                            </div>
                            <div className="text-3xl">🏦</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/60">TokenSwap SCAI</p>
                                <p className="text-2xl font-bold text-blue-400">{parseFloat(tokenSwapScaiBalance).toFixed(0)} SCAI</p>
                            </div>
                            <div className="text-3xl">🔄</div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-4 flex items-center justify-between relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-sm text-white/60">System Health</p>
                                <p className={`text-2xl font-bold ${health.color}`}>{health.label}</p>
                            </div>
                            <div className="text-3xl relative z-10">{health.icon}</div>
                            <div className={`absolute top-0 right-0 w-20 h-20 blur-xl opacity-20 bg-${health.color.replace('text-', '')}`}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Min Stake */}
                        <div className="bg-black/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white/80">Minimum Stake</span>
                                <span className="text-lg">💰</span>
                            </div>
                            <div className="text-2xl font-bold text-treasure-400">
                                {parseFloat(currentMinStake).toFixed(0)}
                                <span className="text-sm text-white/50 ml-1">SCAI</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={newMinStake}
                                    onChange={(e) => setNewMinStake(e.target.value)}
                                    placeholder="New value"
                                    className="input-field flex-1 text-sm py-2"
                                    step="0.01"
                                />
                                <button
                                    onClick={handleSetMinStake}
                                    disabled={submitting || !newMinStake}
                                    className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
                                >
                                    Set
                                </button>
                            </div>
                        </div>

                        {/* Fee */}
                        <div className="bg-black/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white/80">Claim Fee</span>
                                <span className="text-lg">📊</span>
                            </div>
                            <div className="text-2xl font-bold text-purple-400">
                                {currentFee}
                                <span className="text-sm text-white/50 ml-1">%</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={newFee}
                                    onChange={(e) => setNewFee(e.target.value)}
                                    placeholder="0-10"
                                    className="input-field flex-1 text-sm py-2"
                                    step="1"
                                    min="0"
                                    max="10"
                                />
                                <button
                                    onClick={handleSetFee}
                                    disabled={submitting || !newFee}
                                    className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
                                >
                                    Set
                                </button>
                            </div>
                        </div>

                        {/* Min Sell Amount */}
                        <div className="bg-black/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white/80">Min Sell Amount</span>
                                <span className="text-lg">💵</span>
                            </div>
                            <div className="text-2xl font-bold text-green-400">
                                {parseFloat(currentMinSellAmount).toFixed(0)}
                                <span className="text-sm text-white/50 ml-1">SCAI</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={newMinSellAmount}
                                    onChange={(e) => setNewMinSellAmount(e.target.value)}
                                    placeholder="New value"
                                    className="input-field flex-1 text-sm py-2"
                                    step="0.01"
                                />
                                <button
                                    onClick={handleSetMinSellAmount}
                                    disabled={submitting || !newMinSellAmount}
                                    className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
                                >
                                    Set
                                </button>
                            </div>
                        </div>

                        {/* TokenSwap ETH Balance */}
                        <div className="bg-black/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white/80">TokenSwap Balance</span>
                                <span className="text-lg">💰</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-400">
                                {tokenSwapEthBalance}
                                <span className="text-sm text-white/50 ml-1">ETH</span>
                            </div>
                            <div className="text-xs text-white/40">
                                Balance in Swap Contract
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
