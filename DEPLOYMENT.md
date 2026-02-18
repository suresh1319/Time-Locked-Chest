# Deployment Summary

## ✅ Successfully Deployed to Sepolia Testnet

**Deployment Time**: 2026-02-17 (Updated)  
**Network**: Sepolia (Chain ID: 11155111)  
**Deployer**: 0x3A875e02c59c75296069DF86709e6C1a6fF58268

## 📝 Contract Addresses

### SCAIToken (ERC20) ✅ VERIFIED
- **Address**: `0x7d2cEfF4eb041B32682A2c57deC532Dd22151194`
- **Explorer**: https://sepolia.etherscan.io/address/0x7d2cEfF4eb041B32682A2c57deC532Dd22151194#code
- **Total Supply**: 1,000,000 SCAI

### TimeLockedChest ✅ VERIFIED
- **Address**: `0x58A1ebCd90A80D5b20005c5F8bBeF977d360b72c`
- **Explorer**: https://sepolia.etherscan.io/address/0x58A1ebCd90A80D5b20005c5F8bBeF977d360b72c#code
- **Token**: `0x7d2cEfF4eb041B32682A2c57deC532Dd22151194`

## 🎯 Next Steps

### 1. Fund the Treasury

The TimeLockedChest contract needs SCAI tokens to pay out rewards. Transfer tokens using:

**Via Etherscan**:
1. Go to SCAIToken on Sepolia Etherscan: https://sepolia.etherscan.io/address/0x7d2cEfF4eb041B32682A2c57deC532Dd22151194#writeContract
2. Click "Write Contract" → "Connect to Web3"
3. Use `transfer` function:
   - `to`: `0x58A1ebCd90A80D5b20005c5F8bBeF977d360b72c`
   - `amount`: `100000000000000000000000` (100,000 SCAI with 18 decimals)

**Via Hardhat Console**:
```bash
npx hardhat console --network sepolia
```
```javascript
const scai = await ethers.getContractAt("SCAIToken", "0x7d2cEfF4eb041B32682A2c57deC532Dd22151194");
await scai.transfer("0x58A1ebCd90A80D5b20005c5F8bBeF977d360b72c", ethers.parseEther("100000"));
```

### 2. Test the Contracts

Interact with the contracts via Etherscan:

**Approve & Lock Tokens**:
1. Approve TimeLockedChest to spend your SCAI
2. Call `lock(amount, duration)` with:
   - amount: e.g., `100000000000000000000` (100 SCAI)
   - duration: `3600` (1 hour), `21600` (6 hours), or `86400` (24 hours)
3. Check your locks with `getUserLocks(yourAddress)`

**Claim Rewards**:
- After the lock period, call `claim(lockIndex)` to receive your rewards!

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is already configured with the deployed contract addresses!

## 📊 Deployment Details

```json
{
  "network": "sepolia",
  "deployer": "0x3A875e02c59c75296069DF86709e6C1a6fF58268",
  "contracts": {
    "SCAIToken": "0x7d2cEfF4eb041B32682A2c57deC532Dd22151194",
    "TimeLockedChest": "0x58A1ebCd90A80D5b20005c5F8bBeF977d360b72c"
  },
  "verified": true
}
```

---

**Deployment Complete! 🎉** Your contracts are live on Sepolia testnet.
