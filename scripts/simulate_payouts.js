const { ethers } = require("hardhat");

async function main() {
    console.log("🎲 Simulating Payout Logic...");

    const SCAIToken = await ethers.getContractFactory("SCAIToken");
    const token = await SCAIToken.deploy();
    await token.waitForDeployment();

    const TimeLockedChest = await ethers.getContractFactory("TimeLockedChest");
    const chest = await TimeLockedChest.deploy(await token.getAddress());
    await chest.waitForDeployment();

    const [owner] = await ethers.getSigners();

    // Stats
    let totalIn = 0n;
    let totalOut = 0n;
    const runs = 1000;
    const stakeAmount = ethers.parseEther("100");
    const duration = 3600; // 1 hour

    // Fund chest (50% of supply)
    await token.transfer(await chest.getAddress(), ethers.parseEther("500000"));

    // Approve
    await token.approve(await chest.getAddress(), ethers.MaxUint256);

    console.log(`Running ${runs} simulations...`);

    for (let i = 0; i < runs; i++) {
        try {
            // Lock
            const tx = await chest.lock(stakeAmount, duration);
            await tx.wait();
            totalIn += stakeAmount;

            // Fast forward
            await ethers.provider.send("evm_increaseTime", [duration + 1]);
            await ethers.provider.send("evm_mine");

            // Claim
            const balanceBefore = await token.balanceOf(owner.address);
            const claimTx = await chest.claim(i);
            await claimTx.wait();
            const balanceAfter = await token.balanceOf(owner.address);

            const payout = balanceAfter - balanceBefore;
            totalOut += payout;

            if (i % 100 === 0) process.stdout.write(".");
        } catch (error) {
            console.error(`\n❌ Error at run ${i}:`, error.message);
            break;
        }
    }

    const ratio = Number(totalOut) / Number(totalIn);
    const result = `
📊 Results:
Total Staked: ${ethers.formatEther(totalIn)} SCAI
Total Paid:   ${ethers.formatEther(totalOut)} SCAI
Payout Ratio: ${ratio.toFixed(4)}x
${ratio < 1.0 ? "✅ SUSTAINABLE: Treasury is growing (House Edge active)." : "❌ DRAINING: Treasury is losing money!"}
`;
    console.log(result);
    const fs = require("fs");
    fs.writeFileSync("simulation_result.txt", result);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
