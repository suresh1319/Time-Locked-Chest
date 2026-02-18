# Time-Locked Chest Frontend

React frontend for the Time-Locked Chest Web3 game.

## Features

- 🔗 MetaMask wallet connection
- 💰 Token approval and staking
- ⏱️ Multiple lock durations (1h, 6h, 24h)
- 📊 Live guarantee/risk calculation
- 🎁 Active chests dashboard with countdown timers
- ✨ Beautiful treasure-themed UI with animations
- 📱 Responsive design

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Update Contract Addresses

Edit `src/config.js` and update the contract addresses after deployment:

```javascript
export const CONTRACTS = {
  SCAI_TOKEN: 'YOUR_SCAI_TOKEN_ADDRESS',
  TIME_LOCKED_CHEST: 'YOUR_CHEST_CONTRACT_ADDRESS'
};
```

### 3. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask
2. **Approve Tokens**: Enter amount and click "Approve" (first time only)
3. **Lock Tokens**: Choose duration and click "Lock"
4. **View Chests**: See your active locks with countdown timers
5. **Claim Rewards**: Click "Claim" when chest is unlocked

## Tech Stack

- ⚛️ React 18
- ⚡ Vite
- 🎨 Tailwind CSS
- 🔗 Ethers.js v6
- 🦊 MetaMask Integration

## Components

- `WalletConnect.jsx` - Wallet connection & network switching
- `StakeForm.jsx` - Token approval & staking interface
- `ChestsList.jsx` - Active chests with claim functionality
- `Statistics.jsx` - Global contract statistics
- `App.jsx` - Main application layout

## Customization

### Colors

Edit `tailwind.config.js` to customize the treasure theme colors.

### Animations

Modify the keyframes in `tailwind.config.js` for custom animations.

---

**Happy Staking! 🎉**
