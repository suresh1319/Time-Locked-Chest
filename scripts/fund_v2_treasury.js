const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting treasury funding check...\n");

    // Load deployment addresses
    const deploymentPath = path.join(__dirname, "..", "deployed-addresses.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("⚠️ Deployment file not found. Run deploy script first.");
    }
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    // Check if we are on the same network
    if (deploymentData.network !== hre.network.name) {
        console.warn(`⚠️ Warning: deployment file is for ${deploymentData.network}, but running on ${hre.network.name}`);
    }

    const { SCAIToken, TimeLockedChest } = deploymentData.contracts;
    console.log(`SCAIToken: ${SCAIToken}`);
    console.log(`TimeLockedChest: ${TimeLockedChest}`);

    const [signer] = await hre.ethers.getSigners();
    console.log(`Using account: ${signer.address}`);

    // Connect to contracts
    const scaiToken = await hre.ethers.getContractAt("SCAIToken", SCAIToken, signer);

    // Check balances
    const chestBalance = await scaiToken.balanceOf(TimeLockedChest);
    console.log(`Current Chest Balance: ${hre.ethers.formatEther(chestBalance)} SCAI`);

    const signerBalance = await scaiToken.balanceOf(signer.address);
    console.log(`Signer Balance: ${hre.ethers.formatEther(signerBalance)} SCAI`);

    // Fund amount
    const FUND_AMOUNT = hre.ethers.parseEther("500000"); // 500,000 SCAI

    if (chestBalance >= FUND_AMOUNT) {
        console.log("✅ Treasury is already well funded.");
    } else {
        if (signerBalance < FUND_AMOUNT) {
            console.error("❌ Signer does not have enough SCAI to fund the treasury.");
            return;
        }

        console.log(`Funding treasury with 500,000 SCAI...`);
        const tx = await scaiToken.transfer(TimeLockedChest, FUND_AMOUNT);
        console.log(`Tx sent: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Funding complete!");

        const newBalance = await scaiToken.balanceOf(TimeLockedChest);
        console.log(`New Chest Balance: ${hre.ethers.formatEther(newBalance)} SCAI`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
