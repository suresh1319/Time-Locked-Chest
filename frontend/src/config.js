// Contract addresses (update these after deployment)
export const TARGET_CHAIN_ID = 11155111;

export const CONTRACTS = {
    // Sepolia Addresses
    SCAI_TOKEN: '0x9bd5De757aE75292cf82E3508600f62FCbC56c9C',
    TIME_LOCKED_CHEST: '0xb3BaaDF2A33E381fD2d53a35e4428274651F0Fa4',
    TOKEN_SWAP: '0x7cB512Aba8d01DC17ef72C009Cf4A9c3878C1c7D'
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
