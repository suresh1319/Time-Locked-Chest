// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/*
 * @title TimeLockedChest
 * @dev A Web3 mini-game where users lock ERC-20 tokens for fixed durations
 * with guaranteed returns and risk-based multipliers
 */
contract TimeLockedChest is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    
    IERC20 public immutable token;
    
    uint256 public totalLocked;
    uint256 public activeLocked; // Tracks currently locked tokens
    uint256 public totalPaidOut;    // Gross payout (before fee deduction)
    uint256 public totalFeesCollected; // Total fees retained by the treasury
    
    // Duration constants (in seconds)
    uint256 public constant DURATION_1H = 1 hours;
    uint256 public constant DURATION_6H = 6 hours;
    uint256 public constant DURATION_24H = 24 hours;
    
    // Configurable limits and fees
    uint256 public minStake = 1 ether;
    uint256 public fee = 2; // 2% default fee

    
    struct Lock {
        address user;
        uint256 amount;
        uint256 duration;
        uint256 lockTime;
        bool claimed;
        uint256 randomSeed;
    }
    
    
    mapping(address => Lock[]) public userLocks;
    
    event LockCreated(
        address indexed user,
        uint256 indexed lockIndex,
        uint256 amount,
        uint256 duration,
        uint256 lockTime,
        uint256 randomSeed
    );
    
    event LockClaimed(
        address indexed user,
        uint256 indexed lockIndex,
        uint256 stakedAmount,
        uint256 payout,
        uint256 guaranteedAmount,
        uint256 riskReward
    );

    event MinStakeUpdated(uint256 newMinStake);
    event FeeUpdated(uint256 newFee);
    
    // Initializes the contract with the ERC20 token address.
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }
    
    // Allows users to lock tokens for a fixed duration to earn rewards.
    function lock(uint256 amount, uint256 duration) external nonReentrant {
        require(amount >= minStake, "Amount below minimum stake");
        require(duration == DURATION_1H || duration == DURATION_6H || duration == DURATION_24H, "Invalid duration");

        // Worst-case payout is 5x the staked amount (jackpot multiplier).
        uint256 maxPossiblePayout = amount * 5;
        require(
            token.balanceOf(address(this)) >= activeLocked + maxPossiblePayout,
            "Treasury too low for this stake"
        );

        token.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 userLockCount = userLocks[msg.sender].length;
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp, block.prevrandao, userLockCount)));
        
        userLocks[msg.sender].push(Lock({
            user: msg.sender,
            amount: amount,
            duration: duration,
            lockTime: block.timestamp,
            claimed: false,
            randomSeed: randomSeed
        }));
        
        totalLocked += amount;
        activeLocked += amount;
        
        emit LockCreated(msg.sender, userLockCount, amount, duration, block.timestamp, randomSeed);
    }
    
    // Claims reward after lock period ends, calculating payout based on random multiplier.
    function claim(uint256 lockIndex) external nonReentrant {
        require(lockIndex < userLocks[msg.sender].length, "Lock does not exist");
        
        Lock storage userLock = userLocks[msg.sender][lockIndex];
        require(!userLock.claimed, "Lock already claimed");
        require(userLock.user == msg.sender, "Not lock owner");
        require(block.timestamp >= userLock.lockTime + userLock.duration, "Lock period not finished");
        
        userLock.claimed = true;
        
        uint256 guaranteePercentage = _calculateGuaranteePercentage(userLock.amount, userLock.duration);
        uint256 guaranteedAmount = (userLock.amount * guaranteePercentage) / 100;
        
        uint256 riskAmount = userLock.amount - guaranteedAmount;
        uint256 multiplier = _calculateRiskMultiplier(userLock.randomSeed);
        uint256 riskReward = (riskAmount * multiplier) / 10000;
        
        uint256 payout = guaranteedAmount + riskReward;
        
        // Deduct Fee
        uint256 feeAmount = (payout * fee) / 100;
        uint256 payoutAfterFee = payout - feeAmount;

        require(token.balanceOf(address(this)) >= payout, "Insufficient treasury balance");

        // BUG-3: Track gross payout and fees separately for accurate accounting.
        totalPaidOut += payout;         // Gross amount before fee
        totalFeesCollected += feeAmount; // Fee retained by treasury
        activeLocked -= userLock.amount;
        
        // Transfer payout to user
        token.safeTransfer(msg.sender, payoutAfterFee);
        
        emit LockClaimed(msg.sender, lockIndex, userLock.amount, payoutAfterFee, guaranteedAmount, riskReward);
    }
    
    
    // Returns all locks for a specific user.
    function getUserLocks(address user) external view returns (Lock[] memory) {
        return userLocks[user];
    }
    
    // Returns the total number of locks for a user.
    function getUserLockCount(address user) external view returns (uint256) {
        return userLocks[user].length;
    }
    
    /**
     * @notice Preview the potential payout for a lock
     * @param user Address of the user
     * @param lockIndex Index of the lock
     * @return guaranteedAmount The guaranteed portion
     * @return minPayout Minimum possible payout
     * @return maxPayout Maximum possible payout
     */
    // Estimates the minimum, guaranteed, and maximum payout for a lock.
    function previewPayout(address user, uint256 lockIndex) external view returns (uint256 guaranteedAmount, uint256 minPayout, uint256 maxPayout) {
        require(lockIndex < userLocks[user].length, "Lock does not exist");
        
        Lock memory userLock = userLocks[user][lockIndex];
        
        uint256 guaranteePercentage = _calculateGuaranteePercentage(userLock.amount, userLock.duration);
        guaranteedAmount = (userLock.amount * guaranteePercentage) / 100;
        
        uint256 riskAmount = userLock.amount - guaranteedAmount;
        
        // Min: 0.5x multiplier on risk (5000 basis points)
        minPayout = guaranteedAmount + (riskAmount * 5000) / 10000;
        
        // Max: 5.0x multiplier on risk (50000 basis points)
        maxPayout = guaranteedAmount + (riskAmount * 50000) / 10000;
    }

    // Calculates the exact payout for a lock that is ready to be claimed.
    function calculatePayout(address user, uint256 lockIndex) external view returns (uint256 payout) {
        require(lockIndex < userLocks[user].length, "Lock does not exist");
        
        Lock memory userLock = userLocks[user][lockIndex];
        
        uint256 guaranteePercentage = _calculateGuaranteePercentage(userLock.amount, userLock.duration);
        uint256 guaranteedAmount = (userLock.amount * guaranteePercentage) / 100;
        uint256 riskAmount = userLock.amount - guaranteedAmount;
        uint256 multiplier = _calculateRiskMultiplier(userLock.randomSeed);
        uint256 riskReward = (riskAmount * multiplier) / 10000;
        
        payout = guaranteedAmount + riskReward;
    }

    // Returns the current SCAI token balance of the contract.
    function getTreasuryBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // Owner-only setters for configurable parameters
    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
        emit MinStakeUpdated(_minStake);
    }



    function setFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10, "Fee cannot exceed 10%");
        fee = _fee;
        emit FeeUpdated(_fee);
    }

    // Determines the guaranteed percentage of the stake based on amount and duration.
    // V2 Logic: Asymptotic Bonus + Hard Cap at 80%
    function _calculateGuaranteePercentage(uint256 amount, uint256 duration) internal pure returns (uint256) {
        uint256 baseGuarantee = 20; // V2: 20% for 1 hour
        
        if (duration == DURATION_6H) {
            baseGuarantee = 35; // V2: 35% for 6 hours
        } else if (duration == DURATION_24H) {
            baseGuarantee = 45; // V2: 45% for 24 hours
        }

        // V2 Amount Bonus: Asymptotic Curve
        // Formula: Bonus = MaxBonus * (Amount / (Amount + k))
        // MaxBonus = 30%, k = 2000 ether
        // We use 1e18 precision for the calculation
        
        uint256 amountInEther = amount / 1 ether; // Simplify for calculation (assuming 18 decimals)
        if (amountInEther == 0) amountInEther = 1; // Prevent division by zero if < 1 token (though minStake handles this)

        // Using high precision for intermediate steps
        uint256 k = 2000;
        uint256 maxBonus = 30;
        
        // Calculate bonus: 30 * (amt / (amt + 2000))
        uint256 bonus = (maxBonus * amountInEther) / (amountInEther + k);
        
        uint256 totalGuarantee = baseGuarantee + bonus;
        
        // V2 Hard Cap: 80%
        return totalGuarantee > 80 ? 80 : totalGuarantee;
    }

    // Determines the risk multiplier based on a random seed.
    // V2 Logic: EV ~0.90 (House Edge 10%)
    function _calculateRiskMultiplier(uint256 randomSeed) internal pure returns (uint256) {
        uint256 randomValue = randomSeed % 100;
        
        // 0-47:  0.5x (48%) - Loss
        // 48-82: 1.0x (35%) - Refund
        // 83-94: 1.5x (12%) - Profit
        // 95-98: 2.0x (4%)  - Big Win
        // 99:    5.0x (1%)  - Jackpot
        
        if (randomValue < 48) return 5000;  // 0.5x
        if (randomValue < 83) return 10000; // 1.0x
        if (randomValue < 95) return 15000; // 1.5x
        if (randomValue < 99) return 20000; // 2.0x
        return 50000;                       // 5.0x
    }
}
