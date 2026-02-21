// Minimal ABIs for interacting with contracts
export const TOKEN_SWAP_ABI = [
    'function buyTokens() payable',
    'function sellTokens(uint256 amount)',
    'function rate() view returns (uint256)',
    'function sellFeePercentage() view returns (uint256)',
    'function minSellAmount() view returns (uint256)',
    'function setMinSellAmount(uint256 _newMin)',
    'event TokensPurchased(address indexed buyer, address indexed token, uint256 amountOfETH, uint256 amountOfTokens)',
    'event TokensSold(address indexed seller, address indexed token, uint256 amountOfTokens, uint256 amountOfETH)'
];

export const SCAI_TOKEN_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
];

export const TIME_LOCKED_CHEST_ABI = [
    'function lock(uint256 amount, uint256 duration)',
    'function claim(uint256 lockIndex)',
    'function getUserLocks(address user) view returns (tuple(address user, uint256 amount, uint256 duration, uint256 lockTime, bool claimed, uint256 randomSeed)[])',
    'function getUserLockCount(address user) view returns (uint256)',
    'function previewPayout(address user, uint256 lockIndex) view returns (uint256 guaranteedAmount, uint256 minPayout, uint256 maxPayout)',
    'function calculatePayout(address user, uint256 lockIndex) view returns (uint256)',
    'function getTreasuryBalance() view returns (uint256)',
    'function totalLocked() view returns (uint256)',
    'function activeLocked() view returns (uint256)',
    'function totalPaidOut() view returns (uint256)',
    'function minStake() view returns (uint256)',
    'function fee() view returns (uint256)',
    'function owner() view returns (address)',
    'function setMinStake(uint256 _minStake)',
    'function setFee(uint256 _fee)',
    'event LockCreated(address indexed user, uint256 indexed lockIndex, uint256 amount, uint256 duration, uint256 lockTime, uint256 randomSeed)',
    'event LockClaimed(address indexed user, uint256 indexed lockIndex, uint256 stakedAmount, uint256 payout, uint256 guaranteedAmount, uint256 riskReward)'
];
