// Contract addresses (update these after deployment)
export const TARGET_CHAIN_ID = 11155111;

export const CONTRACTS = {
    // Sepolia Addresses
    SCAI_TOKEN: '0x46a22Bedd03EeB8c69D71b3a55368C3685ad9801',
    TIME_LOCKED_CHEST: '0x565470b64eB36acc6f8714fF5963Fa3cfb182cD5',
    TOKEN_SWAP: '0xFe4C91C6A59963f9655334861D356FD57787b65b'
};

export const DURATIONS = {
    ONE_HOUR: { value: 3600, label: '1 Hour', emoji: '⚡' },
    SIX_HOURS: { value: 21600, label: '6 Hours', emoji: '🔥' },
    TWENTY_FOUR_HOURS: { value: 86400, label: '24 Hours', emoji: '💎' }
};

export const NETWORK_PARAMS = {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
        name: 'SepoliaETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
};
