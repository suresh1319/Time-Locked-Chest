const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenSwap", function () {
    let scaiToken;
    let tokenSwap;
    let owner;
    let user1;

    const RATE = 1000n; // 1000 tokens per 1 ETH
    const FEE = 10n; // 10%

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy Token
        const SCAIToken = await ethers.getContractFactory("SCAIToken");
        scaiToken = await SCAIToken.deploy();

        // Deploy Swap
        const TokenSwap = await ethers.getContractFactory("TokenSwap");
        tokenSwap = await TokenSwap.deploy(await scaiToken.getAddress(), RATE, FEE);

        // Fund Swap with Tokens
        await scaiToken.transfer(await tokenSwap.getAddress(), ethers.parseEther("10000"));

        // Fund User with Tokens
        await scaiToken.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("BUG-5: Should accept direct ETH deposits (receive function)", async function () {
        const depositAmount = ethers.parseEther("1.0");

        await owner.sendTransaction({
            to: await tokenSwap.getAddress(),
            value: depositAmount
        });

        const balance = await ethers.provider.getBalance(await tokenSwap.getAddress());
        expect(balance).to.equal(depositAmount);
    });

    it("BUG-4: Should revert sellTokens if resulting ETH amount is zero", async function () {
        // RATE is 1000. 
        // If we sell 1 wei of token (1 unit), ethAmount = 1 / 1000 = 0.
        const tinyAmount = 1n; // 1 wei

        await scaiToken.connect(user1).approve(await tokenSwap.getAddress(), tinyAmount);

        await expect(
            tokenSwap.connect(user1).sellTokens(tinyAmount)
        ).to.be.revertedWith("Token amount too small to sell");
    });

    it("Should allow selling valid amounts", async function () {
        // Fund contract with ETH so it can pay out
        await owner.sendTransaction({
            to: await tokenSwap.getAddress(),
            value: ethers.parseEther("10.0")
        });

        const sellAmount = ethers.parseEther("1000"); // Should get 1 ETH
        await scaiToken.connect(user1).approve(await tokenSwap.getAddress(), sellAmount);

        // Expect successful sell
        await expect(tokenSwap.connect(user1).sellTokens(sellAmount))
            .to.emit(tokenSwap, "TokensSold");
    });
});
