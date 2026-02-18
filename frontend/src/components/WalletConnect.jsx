import { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import { ethers } from 'ethers';
import { TARGET_CHAIN_ID, NETWORK_PARAMS } from '../config';

export default function WalletConnect({ account, setAccount, provider, setProvider }) {
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');

    const connectWallet = async () => {
        setConnecting(true);
        setError('');

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed! Please install MetaMask.');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            // Create provider
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const network = await web3Provider.getNetwork();

            // Check if on Sepolia
            if (Number(network.chainId) !== TARGET_CHAIN_ID) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: NETWORK_PARAMS.chainId }],
                    });
                } catch (switchError) {
                    // Chain doesn't exist, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [NETWORK_PARAMS],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            setProvider(web3Provider);
            setAccount(accounts[0]);
        } catch (err) {
            console.error('Connection error:', err);
            setError(err.message);
        } finally {
            setConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
    };

    if (account) {
        return (
            <div className="flex items-center gap-3">
                <div className="bg-green-500/20 border border-green-500/40 rounded-full px-4 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm">
                        {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                </div>
                <button
                    onClick={async () => {
                        try {
                            await window.ethereum.request({
                                method: "wallet_requestPermissions",
                                params: [{ eth_accounts: {} }]
                            });
                            // After permission change, accountsChanged event will likely fire
                            // But we can also just call connectWallet or let the event listener handle it
                            // For simplicity, we'll just clear state and let user connect again if needed, 
                            // or the permission modal will handle the switch.
                            disconnectWallet();
                        } catch (err) {
                            console.error("Switch error:", err);
                        }
                    }}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                >
                    Switch Wallet
                </button>
                <button
                    onClick={disconnectWallet}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={connectWallet}
                disabled={connecting}
                className="btn-primary flex items-center gap-2"
            >
                <Wallet size={20} />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && (
                <p className="text-red-400 text-sm mt-2 max-w-xs">{error}</p>
            )}
        </div>
    );
}
