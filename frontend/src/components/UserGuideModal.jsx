import { BookOpen } from 'lucide-react';

export default function UserGuideModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-[#1a103c] border-2 border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative">

                {/* Header */}
                <div className="sticky top-0 bg-[#1a103c]/90 backdrop-blur-md p-6 border-b border-white/10 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="text-treasure-400" />
                        How to Use Time-Locked Chest
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* Step 1 */}
                    <section>
                        <h3 className="text-lg font-bold text-treasure-400 mb-3 flex items-center gap-2">
                            <span className="bg-treasure-400/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                            Connect & Get Tokens
                        </h3>
                        <div className="pl-10 space-y-2 text-white/80">
                            <p>First, connect your MetaMask wallet using the <strong>Connect Wallet</strong> button in the top right.</p>
                            <p>You need Sepolia ETH for gas fees (get some from a <a href="https://sepoliafaucet.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Sepolia Faucet</a>).</p>
                            <p>If you don't have SCAI tokens, use the <strong>💱 Buy/Sell Tokens</strong> button to swap some Sepolia ETH for SCAI.</p>
                        </div>
                    </section>

                    {/* Step 2 */}
                    <section>
                        <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                            <span className="bg-blue-400/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                            Lock Your Tokens
                        </h3>
                        <div className="pl-10 space-y-3 text-white/80">
                            <p>In the <strong>Lock Tokens</strong> section, enter the amount of SCAI you want to stake.</p>
                            <p>Choose a lock duration:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm bg-white/5 p-3 rounded-lg">
                                <li><strong>1 Hour:</strong> Standard multiplier (1x)</li>
                                <li><strong>6 Hours:</strong> 2x bonus multiplier</li>
                                <li><strong>24 Hours:</strong> 3x bonus multiplier</li>
                            </ul>
                            <p>Your returns have two parts:</p>
                            <div className="flex gap-4 mt-2">
                                <div className="bg-green-500/10 border border-green-500/30 p-2 rounded-lg flex-1">
                                    <span className="font-bold text-green-400 text-sm block">🛡️ Guaranteed</span>
                                    <span className="text-xs">30-90% of your stake is always protected.</span>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 rounded-lg flex-1">
                                    <span className="font-bold text-yellow-400 text-sm block">🎲 Risk Bonus</span>
                                    <span className="text-xs">The rest is multiplied randomly (0.5x to 2.5x).</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Step 3 */}
                    <section>
                        <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                            <span className="bg-green-400/20 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                            Claim Your Rewards
                        </h3>
                        <div className="pl-10 space-y-2 text-white/80">
                            <p>Watch your chests in the <strong>Your Treasure Chests</strong> section.</p>
                            <p>Once the timer hits zero, the chest glows green and says <strong>Ready to Claim!</strong></p>
                            <p>Click the claim button to reveal your final payout and transfer the tokens back to your wallet.</p>
                            <p className="text-sm text-treasure-400 mt-2 p-3 bg-treasure-400/10 rounded-lg border border-treasure-400/20">
                                <strong>💡 Note:</strong> There is <strong>no minimum limit</strong> for claiming your payout! Minimum withdrawal amounts only apply when you are selling SCAI tokens back for ETH in the Swap menu.
                            </p>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 bg-black/20 border-t border-white/10 text-center">
                    <button
                        onClick={onClose}
                        className="btn-primary px-8 py-2"
                    >
                        Got it, let's play!
                    </button>
                </div>
            </div>
        </div>
    );
}
