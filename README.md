# Time-Locked Chest - Deployment & Usage Guide

## 📋 Prerequisites

- Node.js v18 or higher
- MetaMask wallet with Sepolia ETH
- Sepolia RPC URL (from Alchemy or Infura)
- Etherscan API key

## 🚀 Quick Start
![alt text](image.png)
### 1. Install Dependencies

```bash
cd time-locked-chest
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

> [!WARNING]
> Never commit your `.env` file to version control!

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test
```

Expected output: All 28 tests passing ✅

### 5. Deploy to Sepolia

```bash
npm run deploy
```

This will:
- Deploy `SCAIToken.sol`
- Deploy `TimeLockedChest.sol`
- Deploy `TokenSwap.sol`
- Automatically fund the chest treasury and TokenSwap liquidity pool
- Save addresses to `deployed-addresses.json`

### 6. Verify Contracts on Etherscan

After deployment, verify the contracts:

```bash
# Verify SCAIToken
npx hardhat verify --network sepolia <SCAI_TOKEN_ADDRESS>

# Verify TimeLockedChest
npx hardhat verify --network sepolia <CHEST_ADDRESS> <SCAI_TOKEN_ADDRESS>

# Verify TokenSwap
npx hardhat verify --network sepolia <TOKEN_SWAP_ADDRESS> <SCAI_TOKEN_ADDRESS> 100000 2
```

Replace the addresses with the ones from `deployed-addresses.json`.

## 💰 Treasury Funding

> [!NOTE]
> The expected treasury funding for the `TimeLockedChest` and liquidity for the `TokenSwap` are automatically sent during the deployment script execution.

If manual funding is later required, you can use the `transfer` function on the SCAIToken contract to allocate more rewards to the chest.

## 🎮 Interact with Contracts

### Approve Tokens

Before locking, users must approve the TimeLockedChest to spend their tokens:

```javascript
await scai.approve(chestAddress, ethers.parseEther("100"));
```

### Lock Tokens

```javascript
const chest = await ethers.getContractAt("TimeLockedChest", "CHEST_ADDRESS");

// Lock 100 tokens for 1 hour
await chest.lock(ethers.parseEther("100"), 3600);

// Lock 500 tokens for 6 hours
await chest.lock(ethers.parseEther("500"), 21600);

// Lock 1000 tokens for 24 hours
await chest.lock(ethers.parseEther("1000"), 86400);
```

### Check Your Locks

```javascript
const locks = await chest.getUserLocks("YOUR_ADDRESS");
console.log(locks);
```

### Preview Payout

```javascript
const preview = await chest.previewPayout("YOUR_ADDRESS", 0); // lockIndex 0
console.log("Guaranteed:", ethers.formatEther(preview.guaranteedAmount));
console.log("Min Payout:", ethers.formatEther(preview.minPayout));
console.log("Max Payout:", ethers.formatEther(preview.maxPayout));
```

### Claim Rewards

After the lock period ends:

```javascript
await chest.claim(0); // Claim lockIndex 0
```

## 🧪 Local Testing

Start a local Hardhat node:

```bash
npm run node
```

In another terminal, deploy to local network:

```bash
npm run deploy:local
```

## 📊 Game Mechanics

### Guarantee Percentage
- **Small stakes (< 100 SCAI):** ~30% guaranteed
- **Medium stakes (100-1000 SCAI):** 30-50% guaranteed
- **Large stakes (> 1000 SCAI):** Up to 90% guaranteed (never 100%)

### Risk Multipliers
Applied only to the risk portion (non-guaranteed):
- **0.5x** - 20% chance (lose half the risk)
- **1.0x** - 40% chance (break even on risk)
- **1.5x** - 25% chance (1.5x the risk)
- **2.0x** - 10% chance (double the risk)
- **2.5x** - 5% chance (2.5x the risk!)

### Example Payout Calculation

**Stake:** 1000 SCAI  
**Guarantee:** 50% = 500 SCAI  
**Risk Amount:** 500 SCAI  
**Multiplier (lucky!):** 2.0x  

**Final Payout:**
```
= Guaranteed + (Risk × Multiplier)
= 500 + (500 × 2.0)
= 500 + 1000
= 1500 SCAI 🎉
```

## 🔒 Security Features

- ✅ ReentrancyGuard on `lock()` and `claim()`
- ✅ SafeERC20 for all token transfers
- ✅ Treasury balance validation before payouts
- ✅ Randomness generated at lock time (prevents lucky block exploitation)
- ✅ Double-claim protection
- ✅ Duration validation (only 1h, 6h, 24h allowed)

## 📝 Contract Addresses

After deployment, your addresses will be in `deployed-addresses.json`:

```json
{
  "network": "sepolia",
  "contracts": {
    "SCAIToken": "0x...",
    "TimeLockedChest": "0x..."
  }
}
```

## 🐛 Troubleshooting

### "Insufficient treasury balance" error
- The contract doesn't have enough tokens to pay your reward
- Ask the contract owner to fund the treasury

### "Lock period not finished" error
- You're trying to claim too early
- Wait until the lock duration has passed

### "Lock already claimed" error
- You've already claimed this lock
- Each lock can only be claimed once

## 📚 Next Steps

1. Deploy to Sepolia testnet
2. Verify contracts on Etherscan
3. Start local development with the frontend application
4. Share with users!

## 🎨 Frontend Application

The complete React frontend is available in the `frontend` directory.

### Quick Start

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend includes:
- Secure MetaMask wallet connection
- Integrated TokenSwap interface to easily acquire SCAI tokens
- Staking form with duration selection and expected payout previews
- Active chests dashboard to manage and claim rewards
- Beautiful, fully animated user interface

---

**Happy Chest Locking! 🎉**
