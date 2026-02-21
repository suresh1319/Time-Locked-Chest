const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    // ========== Deploy SCAIToken ==========
    console.log("Deploying SCAIToken...");
    const SCAIToken = await hre.ethers.getContractFactory("SCAIToken");
    const scaiToken = await SCAIToken.deploy();
    await scaiToken.waitForDeployment();
    const scaiTokenAddress = await scaiToken.getAddress();

    console.log("✅ SCAIToken deployed to:", scaiTokenAddress);
    console.log("   Total Supply:", hre.ethers.formatEther(await scaiToken.totalSupply()), "SCAI\n");

    // ========== Deploy TimeLockedChest ==========
    console.log("Deploying TimeLockedChest...");
    const TimeLockedChest = await hre.ethers.getContractFactory("TimeLockedChest");
    const timeLockedChest = await TimeLockedChest.deploy(scaiTokenAddress);
    await timeLockedChest.waitForDeployment();
    const chestAddress = await timeLockedChest.getAddress();

    console.log("✅ TimeLockedChest deployed to:", chestAddress);
    console.log("   Token address:", await timeLockedChest.token(), "\n");

    // ========== Deploy TokenSwap ==========
    console.log("Deploying TokenSwap...");
    // 1 ETH = 100000 SCAI
    const RATE = 100000n;
    // 2% Fee on selling
    const SELL_FEE = 2n;

    const TokenSwap = await hre.ethers.getContractFactory("TokenSwap");
    const tokenSwap = await TokenSwap.deploy(scaiTokenAddress, RATE, SELL_FEE);
    await tokenSwap.waitForDeployment();
    const tokenSwapAddress = await tokenSwap.getAddress();

    console.log("✅ TokenSwap deployed to:", tokenSwapAddress);

    // Provide Liquidity to TokenSwap (300,000 SCAI - 30%)
    const swapLiquidity = hre.ethers.parseEther("300000");
    await scaiToken.transfer(tokenSwapAddress, swapLiquidity);
    console.log("   Funded TokenSwap with:", hre.ethers.formatEther(swapLiquidity), "SCAI\n");

    // Provide Treasury Funding to TimeLockedChest (650,000 SCAI - 65%)
    // This allows the contract to pay out rewards immediately
    const treasuryAmount = hre.ethers.parseEther("650000");
    await scaiToken.transfer(chestAddress, treasuryAmount);
    console.log("   Funded TimeLockedChest treasury with:", hre.ethers.formatEther(treasuryAmount), "SCAI\n");

    // ========== Save Deployment Addresses ==========
    const deploymentData = {
        network: hre.network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            SCAIToken: scaiTokenAddress,
            TimeLockedChest: chestAddress,
            TokenSwap: tokenSwapAddress,
        },
    };

    const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
    console.log("📝 Deployment addresses saved to:", outputPath, "\n");

    // ========== Deployment Summary ==========
    console.log("=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("Network:", hre.network.name);
    console.log("SCAIToken:", scaiTokenAddress);
    console.log("TimeLockedChest:", chestAddress);
    console.log("=".repeat(60));

    // ========== Next Steps ==========
    if (hre.network.name === "sepolia") {
        console.log("\n📋 NEXT STEPS:");
        console.log("1. Verify contracts on Etherscan:");
        console.log(`   npx hardhat verify --network sepolia ${scaiTokenAddress}`);
        console.log(`   npx hardhat verify --network sepolia ${chestAddress} ${scaiTokenAddress}`);
        console.log("\n2. Fund the TimeLockedChest treasury:");
        console.log(`   - Transfer SCAI tokens to: ${chestAddress}`);
        console.log(`   - Recommended: Transfer at least 100,000 SCAI`);
        console.log("\n3. Update frontend configuration:");
        console.log(`   - SCAIToken: ${scaiTokenAddress}`);
        console.log(`   - TimeLockedChest: ${chestAddress}`);
        console.log(`   - Network: Sepolia (Chain ID: 11155111)`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
