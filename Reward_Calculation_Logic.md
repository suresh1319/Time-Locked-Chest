# Time-Locked Chest: Reward Calculation & Game Logic

This document explains the core mechanics and payout logic of the **Time-Locked Chest** smart contract.

The game is a Web3 mini-game where users lock ERC-20 tokens (SCAI) for fixed durations to earn rewards. The rewards consist of a **guaranteed portion** and a **risk-based portion** influenced by a random multiplier.

---

## 1. Locking Tokens

When a user locks tokens, they must specify:
- **Amount**: Minimum stake is `1 ether` (1 token with 18 decimals).
- **Duration**: Can be 1 Hour, 6 Hours, or 24 Hours.

Upon locking, the contract calculates a `randomSeed` based on the user's address, block timestamp, the `prevrandao` value, and the user's current lock count.

## 2. Payout Structure

The total payout upon claiming is composed of two parts:
1. **Guaranteed Amount**: A safe portion of your initial stake that is strictly returned to you.
2. **Risk Reward**: The remaining portion of your stake that is subject to a random multiplier.

Total Gross Payout = `Guaranteed Amount` + `Risk Reward`

Finally, a **fee** (default 2%) is deducted from the gross payout before the tokens are transferred to the user.

---

## 3. Calculating the Guaranteed Percentage

The guaranteed percentage determines how much of the initial stake is safe from risk. It is calculated dynamically based on the **duration** and the **amount** locked.

### Minimum Base Guarantee (by Duration)
- **1 Hour lock**: 20%
- **6 Hours lock**: 35%
- **24 Hours lock**: 45%

### Amount Bonus (Asymptotic Curve)
Users who lock larger amounts receive an additional bonus to their guaranteed percentage. This bonus scales asymptotically using the formula:
`Bonus = 30 * (Amount / (Amount + 2000))`

- *Max possible bonus*: ~30%
- *k-value*: 2000 (It takes 2000 tokens to get half of the max bonus, i.e., 15%).

### Total Guarantee & Hard Cap
`Total Guarantee % = Base Guarantee + Bonus`

To maintain protocol health, there is a **Hard Cap of 80%**. The guaranteed percentage can never exceed 80% of the initial stake.

**Example**:
If a user locks 2,000 tokens for 24 Hours:
- Base Guarantee = 45%
- Bonus = `30 * (2000 / (2000 + 2000))` = 15%
- Total Guarantee = 45% + 15% = **60%**

---

## 4. Calculating the Risk Multiplier

The portion of the stake that is *not* guaranteed is considered the **Risk Amount**.
`Risk Amount = Original Stake - Guaranteed Amount`

When claiming the lock, the `randomSeed` generated during the lock is used to calculate a risk multiplier. The odds and multipliers are as follows:

| Roll Result (0-99) | Probability | Multiplier | Outcome Category |
| :--- | :--- | :--- | :--- |
| **0 - 47** | 48% | **0.5x** | Loss (Half of risk amount lost) |
| **48 - 82** | 35% | **1.0x** | Refund (Risk amount returned) |
| **83 - 94** | 12% | **1.5x** | Profit |
| **95 - 98** | 4% | **2.0x** | Big Win |
| **99** | 1% | **5.0x** | Jackpot! |

*Note: The overall Expected Value (EV) of the risk portion is ~0.90, giving the house a ~10% edge on the risk amount.*

**Risk Reward Calculation**: 
`Risk Reward = Risk Amount * Risk Multiplier`

---

## 5. Fees & Final Payout

Before the final transfer, the protocol deducts a dynamic fee (set by the owner, default **2%**) from the Total Gross Payout.

`Fee Amount = (Total Gross Payout * Fee %) / 100`

`Final Payout = Total Gross Payout - Fee Amount`

---

## 6. End-to-End Example

Let's walk through an example where Alice locks **1,000 tokens** for **6 Hours**.

**1. Lock Phase**
- Amount: 1,000 tokens
- Base Guarantee (6H): 35%
- Bonus: `30 * (1000 / (1000 + 2000))` = `30 * (1/3)` = 10%
- Total Guarantee %: 35% + 10% = **45%**

**2. Claim Phase**
- **Guaranteed Amount**: 45% of 1,000 = **450 tokens**
- **Risk Amount**: 1,000 - 450 = **550 tokens**

Assume Alice rolls an **85** (Top 13% roll, 1.5x multiplier):
- **Risk Reward**: 550 * 1.5 = **825 tokens**
- **Total Gross Payout**: 450 (Guaranteed) + 825 (Risk Reward) = **1,275 tokens**

**3. Fee Deduction**
- Fee (2%): 2% of 1,275 = **25.5 tokens**
- **Final Payout to Alice**: 1,275 - 25.5 = **1,249.5 tokens** (A net profit of 249.5 tokens!)
