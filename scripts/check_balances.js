const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔍 Checking Balances...\n");

    const deploymentPath = path.join(__dirname, "..", "deployed-addresses.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("deployed-addresses.json not found.");
    }
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const tokenAddress = deploymentData.contracts.SCAIToken;
    const chestAddress = deploymentData.contracts.TimeLockedChest;
    const deployerAddress = deploymentData.deployer;

    const token = await hre.ethers.getContractAt("SCAIToken", tokenAddress);

    const deployerBalance = await token.balanceOf(deployerAddress);
    const treasuryBalance = await token.balanceOf(chestAddress);

    console.log("Token Address:   ", tokenAddress);
    console.log("Deployer Address:", deployerAddress);
    console.log("Treasury Address:", chestAddress);
    console.log("-".repeat(40));
    console.log("Deployer Balance:", hre.ethers.formatEther(deployerBalance), "SCAI");
    console.log("Treasury Balance:", hre.ethers.formatEther(treasuryBalance), "SCAI");
    console.log("-".repeat(40));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
