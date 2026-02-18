const hre = require("hardhat");

async function main() {
    const scaiAddress = "0x7d2cEfF4eb041B32682A2c57deC532Dd22151194";
    const chestAddress = "0x58A1ebCd90A80D5b20005c5F8bBeF977d360b72c";
    
    const scai = await hre.ethers.getContractAt("SCAIToken", scaiAddress);
    
    console.log("Transferring 100,000 SCAI to TimeLockedChest...");
    const tx = await scai.transfer(chestAddress, hre.ethers.parseEther("100000"));
    await tx.wait();
    
    console.log("✅ Treasury funded!");
    console.log("Balance:", hre.ethers.formatEther(await scai.balanceOf(chestAddress)), "SCAI");
}

main().catch(console.error);
