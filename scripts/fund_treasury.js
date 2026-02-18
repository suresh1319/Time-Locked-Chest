const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("💰 Funding Treasury...");

    // Load deployment data
    const deploymentPath = path.join(__dirname, "..", "deployed-addresses.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("deployed-addresses.json not found. Deploy first.");
    }
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const tokenAddress = deploymentData.contracts.SCAIToken;
    const chestAddress = deploymentData.contracts.TimeLockedChest;

    const [deployer] = await hre.ethers.getSigners();
    console.log("   From:", deployer.address);
    console.log("   To:  ", chestAddress);

    const token = await hre.ethers.getContractAt("SCAIToken", tokenAddress, deployer);

    // Amount to fund: 800,000 tokens (80% of supply)
    const amount = hre.ethers.parseEther("800000");

    // Check balance
    const balance = await token.balanceOf(deployer.address);
    if (balance < amount) {
        throw new Error(`Insufficient deployer balance: ${hre.ethers.formatEther(balance)}`);
    }

    console.log("   Sending 800,000 SCAI...");
    const tx = await token.transfer(chestAddress, amount);
    console.log("   Tx Hash:", tx.hash);
    await tx.wait();

    console.log("✅ Treasury Funded Successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
