const hre = require("hardhat");

async function main() {
    const swapAddress = "0xEE5D9A8c900470C8E441615bA76036002Bb936fe";
    const [deployer] = await hre.ethers.getSigners();

    console.log("Funding TokenSwap at:", swapAddress);
    console.log("Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

    // Send 0.1 ETH to the TokenSwap contract for liquidity
    const amount = hre.ethers.parseEther("0.1");
    const tx = await deployer.sendTransaction({
        to: swapAddress,
        value: amount
    });

    console.log("Waiting for transaction...", tx.hash);
    await tx.wait();

    console.log("Successfully funded TokenSwap with 0.1 ETH!");
    console.log("New TokenSwap balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(swapAddress)));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
