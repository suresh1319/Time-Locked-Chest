const hre = require("hardhat");

async function main() {
    // Current addresses from latest deployment
    const swapAddress = "0xEE5D9A8c900470C8E441615bA76036002Bb936fe";
    const scaiAddress = "0x71F7655c0a5e4CE917cD60C30376C481e89de4b6";

    const [deployer] = await hre.ethers.getSigners();
    console.log("Funding TokenSwap at:", swapAddress);

    // Get the SCAI Token Contract
    const SCAIToken = await hre.ethers.getContractAt("SCAIToken", scaiAddress);

    // Check deployer balance
    const deployerBal = await SCAIToken.balanceOf(deployer.address);
    console.log("Deployer SCAI balance:", hre.ethers.formatEther(deployerBal));

    // Send 25,000 SCAI to TokenSwap to establish initial supply for buyers
    const amount = hre.ethers.parseEther("25000");

    console.log(`Sending 25,000 SCAI to TokenSwap...`);
    const tx = await SCAIToken.transfer(swapAddress, amount);

    console.log("Waiting for transaction...", tx.hash);
    await tx.wait();

    const newSwapBal = await SCAIToken.balanceOf(swapAddress);
    console.log("✅ Successfully funded TokenSwap with SCAI!");
    console.log("New TokenSwap SCAI balance:", hre.ethers.formatEther(newSwapBal));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
