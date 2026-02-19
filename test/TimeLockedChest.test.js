const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TimeLockedChest", function () {
    let scaiToken;
    let timeLockedChest;
    let owner;
    let user1;
    let user2;

    const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
    const TREASURY_FUND = ethers.parseEther("100000"); // 100K tokens
    const MIN_STAKE = ethers.parseEther("1");

    const DURATION_1H = 3600;
    const DURATION_6H = 6 * 3600;
    const DURATION_24H = 24 * 3600;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy SCAIToken
        const SCAIToken = await ethers.getContractFactory("SCAIToken");
        scaiToken = await SCAIToken.deploy();

        // Deploy TimeLockedChest
        const TimeLockedChest = await ethers.getContractFactory("TimeLockedChest");
        timeLockedChest = await TimeLockedChest.deploy(await scaiToken.getAddress());

        // Fund treasury
        await scaiToken.transfer(await timeLockedChest.getAddress(), TREASURY_FUND);

        // Transfer tokens to users for testing
        await scaiToken.transfer(user1.address, ethers.parseEther("10000"));
        await scaiToken.transfer(user2.address, ethers.parseEther("10000"));
    });

    describe("Deployment", function () {
        it("Should set the correct token address", async function () {
            expect(await timeLockedChest.token()).to.equal(await scaiToken.getAddress());
        });

        it("Should have correct initial supply", async function () {
            expect(await scaiToken.totalSupply()).to.equal(INITIAL_SUPPLY);
        });

        it("Should have funded treasury", async function () {
            expect(await timeLockedChest.getTreasuryBalance()).to.equal(TREASURY_FUND);
        });

        it("Should initialize totalLocked and totalPaidOut to zero", async function () {
            expect(await timeLockedChest.totalLocked()).to.equal(0);
            expect(await timeLockedChest.totalPaidOut()).to.equal(0);
        });
    });

    describe("Locking Tokens", function () {
        it("Should create a lock successfully", async function () {
            const amount = ethers.parseEther("100");

            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            const userLocks = await timeLockedChest.getUserLocks(user1.address);
            expect(userLocks.length).to.equal(1);
            expect(userLocks[0].amount).to.equal(amount);
            expect(userLocks[0].duration).to.equal(DURATION_1H);
            expect(userLocks[0].claimed).to.be.false;
        });

        it("Should update totalLocked correctly", async function () {
            const amount = ethers.parseEther("100");

            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            expect(await timeLockedChest.totalLocked()).to.equal(amount);
        });

        it("Should emit LockCreated event", async function () {
            const amount = ethers.parseEther("100");

            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);

            await expect(timeLockedChest.connect(user1).lock(amount, DURATION_1H))
                .to.emit(timeLockedChest, "LockCreated");
        });

        it("Should track activeLocked correctly", async function () {
            const amount = ethers.parseEther("100");
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            expect(await timeLockedChest.activeLocked()).to.equal(amount);
            expect(await timeLockedChest.totalLocked()).to.equal(amount);

            // Fast forward and claim
            await time.increase(DURATION_1H + 1);
            await timeLockedChest.connect(user1).claim(0);

            expect(await timeLockedChest.activeLocked()).to.equal(0);
            expect(await timeLockedChest.totalLocked()).to.equal(amount); // Cumulative stays same
        });

        it("Should revert if amount is below minimum stake", async function () {
            const amount = ethers.parseEther("0.5");

            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);

            await expect(
                timeLockedChest.connect(user1).lock(amount, DURATION_1H)
            ).to.be.revertedWith("Amount below minimum stake");
        });

        it("Should revert with invalid duration", async function () {
            const amount = ethers.parseEther("100");
            const invalidDuration = 7200; // 2 hours (not valid)

            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);

            await expect(
                timeLockedChest.connect(user1).lock(amount, invalidDuration)
            ).to.be.revertedWith("Invalid duration");
        });

        it("Should accept all valid durations (1h, 6h, 24h)", async function () {
            const amount = ethers.parseEther("100");

            // 1 hour
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            // 6 hours
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_6H);

            // 24 hours
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_24H);

            const userLocks = await timeLockedChest.getUserLocks(user1.address);
            expect(userLocks.length).to.equal(3);
        });

        it("Should generate different random seeds for same user", async function () {
            const amount = ethers.parseEther("100");

            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount * 2n);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            const userLocks = await timeLockedChest.getUserLocks(user1.address);
            expect(userLocks[0].randomSeed).to.not.equal(userLocks[1].randomSeed);
        });

        it("Should transfer tokens from user to contract", async function () {
            const amount = ethers.parseEther("100");
            const initialUserBalance = await scaiToken.balanceOf(user1.address);
            const initialContractBalance = await scaiToken.balanceOf(await timeLockedChest.getAddress());

            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            expect(await scaiToken.balanceOf(user1.address)).to.equal(initialUserBalance - amount);
            expect(await scaiToken.balanceOf(await timeLockedChest.getAddress())).to.equal(initialContractBalance + amount);
        });

        it("BUG-2: Should revert if treasury cannot cover 5x max payout", async function () {
            // Treasury has 100,000 tokens. 
            // We need amount * 5 > 100,000 + activeLocked (0) => amount > 20,000.
            const amount = ethers.parseEther("20001");

            // Fund user1
            await scaiToken.connect(owner).transfer(user1.address, amount);
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);

            await expect(
                timeLockedChest.connect(user1).lock(amount, DURATION_1H)
            ).to.be.revertedWith("Treasury too low for this stake");
        });
    });

    describe("Claiming Rewards", function () {
        beforeEach(async function () {
            // Create a lock for user1
            const amount = ethers.parseEther("100");
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);
        });

        it("Should claim successfully after lock period", async function () {
            // Fast forward time
            await time.increase(DURATION_1H + 1);

            await timeLockedChest.connect(user1).claim(0);

            const userLocks = await timeLockedChest.getUserLocks(user1.address);
            expect(userLocks[0].claimed).to.be.true;
        });

        it("Should revert if claiming before lock period ends", async function () {
            await expect(
                timeLockedChest.connect(user1).claim(0)
            ).to.be.revertedWith("Lock period not finished");
        });

        it("Should revert if lock already claimed", async function () {
            await time.increase(DURATION_1H + 1);
            await timeLockedChest.connect(user1).claim(0);

            await expect(
                timeLockedChest.connect(user1).claim(0)
            ).to.be.revertedWith("Lock already claimed");
        });

        it("Should revert if lock does not exist", async function () {
            await expect(
                timeLockedChest.connect(user1).claim(5)
            ).to.be.revertedWith("Lock does not exist");
        });

        it("Should revert if not lock owner", async function () {
            await time.increase(DURATION_1H + 1);

            await expect(
                timeLockedChest.connect(user2).claim(0)
            ).to.be.revertedWith("Lock does not exist");
        });

        it("Should emit LockClaimed event", async function () {
            await time.increase(DURATION_1H + 1);

            await expect(timeLockedChest.connect(user1).claim(0))
                .to.emit(timeLockedChest, "LockClaimed");
        });

        it("Should update totalPaidOut", async function () {
            await time.increase(DURATION_1H + 1);

            const initialPaidOut = await timeLockedChest.totalPaidOut();
            await timeLockedChest.connect(user1).claim(0);
            const finalPaidOut = await timeLockedChest.totalPaidOut();

            expect(finalPaidOut).to.be.gt(initialPaidOut);
        });

        it("Should transfer tokens to user", async function () {
            await time.increase(DURATION_1H + 1);

            const initialUserBalance = await scaiToken.balanceOf(user1.address);
            await timeLockedChest.connect(user1).claim(0);
            const finalUserBalance = await scaiToken.balanceOf(user1.address);

            expect(finalUserBalance).to.be.gt(initialUserBalance);
        });

        it("BUG-3: Should track gross payout and accumulate fees", async function () {
            await time.increase(DURATION_1H + 1);

            const initialPaidOut = await timeLockedChest.totalPaidOut();
            const initialFees = await timeLockedChest.totalFeesCollected();

            await timeLockedChest.connect(user1).claim(0);

            const finalPaidOut = await timeLockedChest.totalPaidOut();
            const finalFees = await timeLockedChest.totalFeesCollected();

            const paidOutDiff = finalPaidOut - initialPaidOut;
            const feesDiff = finalFees - initialFees;

            // Fee is 2%
            // Gross Payout (paidOutDiff) * 2% should equal feesDiff
            expect(feesDiff).to.equal(paidOutDiff * 2n / 100n);
            expect(paidOutDiff).to.be.gt(0);
        });
    });

    describe("Guarantee Percentage", function () {
        it("Should calculate correct guarantee for small stakes", async function () {
            const amount = ethers.parseEther("10"); // Small stake
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            const preview = await timeLockedChest.previewPayout(user1.address, 0);
            // Expected guarantee: ~20% (base) since bonus is negligible
            expect(preview.guaranteedAmount).to.be.closeTo(
                amount * 20n / 100n,
                ethers.parseEther("0.1")
            );
        });

        it("Should calculate correct guarantee for large stakes", async function () {
            const amount = ethers.parseEther("5000"); // Large stake
            await scaiToken.connect(owner).transfer(user1.address, amount);
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            const preview = await timeLockedChest.previewPayout(user1.address, 0);
            // Should be higher than 30% but capped at 90%
            expect(preview.guaranteedAmount).to.be.gt(amount * 30n / 100n);
            expect(preview.guaranteedAmount).to.be.lte(amount * 90n / 100n);
        });

        it("Should never guarantee 100% of stake", async function () {
            const amount = ethers.parseEther("10000"); // Very large stake
            await scaiToken.connect(owner).transfer(user1.address, amount);
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            const preview = await timeLockedChest.previewPayout(user1.address, 0);
            expect(preview.guaranteedAmount).to.be.lt(amount);
            expect(preview.guaranteedAmount).to.be.lte(amount * 90n / 100n);
        });
    });

    describe("Preview Payout", function () {
        it("Should preview payout correctly", async function () {
            const amount = ethers.parseEther("100");
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            const preview = await timeLockedChest.previewPayout(user1.address, 0);

            expect(preview.guaranteedAmount).to.be.gt(0);
            expect(preview.minPayout).to.be.gte(preview.guaranteedAmount);
            expect(preview.maxPayout).to.be.gte(preview.minPayout);
        });

        it("Should have consistent actual payout within min/max range", async function () {
            const amount = ethers.parseEther("100");
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            const preview = await timeLockedChest.previewPayout(user1.address, 0);
            const actualPayout = await timeLockedChest.calculatePayout(user1.address, 0);

            expect(actualPayout).to.be.gte(preview.minPayout);
            expect(actualPayout).to.be.lte(preview.maxPayout);
        });
    });

    describe("View Functions", function () {
        it("Should get user lock count correctly", async function () {
            expect(await timeLockedChest.getUserLockCount(user1.address)).to.equal(0);

            const amount = ethers.parseEther("100");
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount * 3n);

            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);
            expect(await timeLockedChest.getUserLockCount(user1.address)).to.equal(1);

            await timeLockedChest.connect(user1).lock(amount, DURATION_6H);
            expect(await timeLockedChest.getUserLockCount(user1.address)).to.equal(2);

            await timeLockedChest.connect(user1).lock(amount, DURATION_24H);
            expect(await timeLockedChest.getUserLockCount(user1.address)).to.equal(3);
        });

        it("Should get treasury balance", async function () {
            const balance = await timeLockedChest.getTreasuryBalance();
            expect(balance).to.equal(TREASURY_FUND);
        });
    });

    describe("Multiple Users", function () {
        it("Should handle multiple users with separate locks", async function () {
            const amount = ethers.parseEther("100");

            // User1 creates lock
            await scaiToken.connect(user1).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user1).lock(amount, DURATION_1H);

            // User2 creates lock
            await scaiToken.connect(user2).approve(await timeLockedChest.getAddress(), amount);
            await timeLockedChest.connect(user2).lock(amount, DURATION_6H);

            expect(await timeLockedChest.getUserLockCount(user1.address)).to.equal(1);
            expect(await timeLockedChest.getUserLockCount(user2.address)).to.equal(1);

            const user1Locks = await timeLockedChest.getUserLocks(user1.address);
            const user2Locks = await timeLockedChest.getUserLocks(user2.address);

            expect(user1Locks[0].duration).to.equal(DURATION_1H);
            expect(user2Locks[0].duration).to.equal(DURATION_6H);
        });
    });


});
