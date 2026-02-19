import { useState, useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import StakeForm from './components/StakeForm';
import ChestsList from './components/ChestsList';
import Statistics from './components/Statistics';
import SwapComponent from './components/SwapComponent';
import AdminPanel from './components/AdminPanel';
import Transactions from './components/Transactions';
import { Sparkles } from 'lucide-react';

function App() {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showSwap, setShowSwap] = useState(false);

    const handleStakeSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // BUG-10: Keep UI in sync when user changes account or network in MetaMask.
    useEffect(() => {
        if (!window.ethereum) return;
        const handleAccountsChanged = (accounts) => {
            setAccount(accounts[0] || null);
            if (!accounts[0]) setProvider(null);
        };
        const handleChainChanged = () => window.location.reload();
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, []);

    return (
        <div className="min-h-screen py-8 px-4">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-5xl animate-chest-idle">🏆</div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-treasure-400 to-purple-400 bg-clip-text text-transparent">
                                Time-Locked Chest
                            </h1>
                            <p className="text-white/60">Stake tokens, earn guaranteed rewards + risk multipliers</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {account && (
                            <button
                                onClick={() => setShowSwap(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                💱 Buy/Sell Tokens
                            </button>
                        )}
                        <WalletConnect
                            account={account}
                            setAccount={setAccount}
                            provider={provider}
                            setProvider={setProvider}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto">
                {!account ? (
                    <div className="card text-center py-16">
                        <div className="text-6xl mb-4 animate-chest-idle">🎁</div>
                        <h2 className="text-3xl font-bold mb-4">Welcome to Time-Locked Chest!</h2>
                        <p className="text-white/60 mb-6 max-w-md mx-auto">
                            Connect your wallet to start locking tokens and earning rewards with our unique guarantee + risk system.
                        </p>
                        <div className="flex items-center justify-center gap-8 mt-8">
                            <div className="bg-white/5 rounded-lg p-4 max-w-xs">
                                <div className="text-3xl mb-2">🛡️</div>
                                <h3 className="font-semibold mb-1">Guaranteed Returns</h3>
                                <p className="text-sm text-white/60">30-90% of your stake is always protected</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 max-w-xs">
                                <div className="text-3xl mb-2">🎲</div>
                                <h3 className="font-semibold mb-1">Risk Multiplier</h3>
                                <p className="text-sm text-white/60">0.5x to 2.5x on the risk portion</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 max-w-xs">
                                <div className="text-3xl mb-2">⚡</div>
                                <h3 className="font-semibold mb-1">Flexible Durations</h3>
                                <p className="text-sm text-white/60">Choose 1h, 6h, or 24h locks</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Admin Panel (only visible to owner) */}
                        <AdminPanel provider={provider} account={account} refreshTrigger={refreshTrigger} />

                        {/* Statistics and Transactions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Statistics provider={provider} account={account} refreshTrigger={refreshTrigger} />
                            <Transactions provider={provider} refreshTrigger={refreshTrigger} />
                        </div>

                        {/* Two-column layout for Game */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Stake Form */}
                            <div>
                                <StakeForm
                                    provider={provider}
                                    account={account}
                                    onStakeSuccess={handleStakeSuccess}
                                    refreshTrigger={refreshTrigger}
                                />
                            </div>

                            {/* Chests List */}
                            <div>
                                <ChestsList
                                    provider={provider}
                                    account={account}
                                    refreshTrigger={refreshTrigger}
                                />
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="card bg-gradient-to-br from-purple-500/10 to-treasure-500/10">
                            <div className="flex items-start gap-3">
                                <Sparkles className="text-treasure-400 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-lg mb-2">How It Works</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-treasure-400 mb-1">1. Approve & Lock</p>
                                            <p className="text-white/60">Approve SCAI tokens and choose your lock duration</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-treasure-400 mb-1">2. Wait & Watch</p>
                                            <p className="text-white/60">Your chest unlocks after the selected time period</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-treasure-400 mb-1">3. Claim Rewards</p>
                                            <p className="text-white/60">Receive guaranteed amount + risk multiplier bonus!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Token Swap Modal */}
            {showSwap && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-md w-full">
                        <button
                            onClick={() => setShowSwap(false)}
                            className="absolute -top-12 right-0 text-white/60 hover:text-white text-sm"
                        >
                            ✕ Close
                        </button>
                        <SwapComponent
                            provider={provider}
                            account={account}
                            onSwapSuccess={() => {
                                handleStakeSuccess();
                                setShowSwap(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="max-w-7xl mx-auto mt-12 text-center text-white/40 text-sm">
                <p>Time-Locked Chest Game • Built on Sepolia Testnet • Powered by Hardhat & React</p>
            </footer>
        </div>
    );
}

export default App;
