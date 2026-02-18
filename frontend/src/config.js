// Contract addresses (update these after deployment)
export const TARGET_CHAIN_ID = 11155111;

export const CONTRACTS = {
    // Sepolia Addresses
    SCAI_TOKEN: '0x0584c33179edfF256d4ed1FD36F4a88ffFf009Ce',
    TIME_LOCKED_CHEST: '0x04C14110A4C2B5D0Ab55D91924E6B52f3CA0a25d',
    TOKEN_SWAP: '0x4EA41614A8Ddc3dE081eDE207913A59651F0C8a3'
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
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
};
