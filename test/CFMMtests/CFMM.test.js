const { expect } = require("chai");
const { network } = require("hardhat");
const { devNetworks } = require("../../utils/helpers/helper-hardhat");
const { mint_approve } = require("../../utils/test-helpers/test-helpers")
require("dotenv").config();
const networkName = network.name;


!devNetworks.includes(networkName)
? describe.skip
:describe("Testing CFMM contract", function() {
   let CFMM, cfmm, TokenA, tokenA, TokenB, tokenB, alice, bob;

    beforeEach("Set up a contract for testing", async () => {
        [alice, bob] = await ethers.getSigners();
        await deployments.fixture(["all"]); 
        CFMM = (await deployments.get("CFMM")).address;
        cfmm = await ethers.getContractAt("CFMM", CFMM);
        TokenA = (await deployments.get("TokenA")).address;
        tokenA = await ethers.getContractAt("TokenA", TokenA);
        TokenB = (await deployments.get("TokenB")).address;
        tokenB = await ethers.getContractAt("TokenB", TokenB);
    });

    describe("Constructor tests", () => {
        it("Constructor sucessfully initialised", async () => {
            expect(await cfmm.tokenA()).to.equal(process.env.TOKEN_A_LOCAL_ADDRESS);
            expect(await cfmm.tokenB()).to.equal(process.env.TOKEN_B_LOCAL_ADDRESS);
        });
    });

    describe("Add liquidity tests", () => {
        let liquidityA, liquidityB;

        beforeEach("Set up liquidity", async() => {
            liquidityA = 1000;
            liquidityB = 500;
        })
        
        it("Add liquidity(tokenA and tokenB)", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.addLiquidity(liquidityA, liquidityB);
            expect(await cfmm.reserveA()).to.equal(liquidityA);
            expect(await cfmm.reserveB()).to.equal(liquidityB);
        });

        it("Calculate LP shares, when no liquidity was added before", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.addLiquidity(liquidityA, liquidityB);
            // calculate shares by the formula sqrt(a * b)
            const expectedShares = Math.floor(Math.sqrt(liquidityA * liquidityB));
            const actualShares = await cfmm.getShares();
            expect(expectedShares).to.equal(actualShares);
        });

        it("Calculate LP shares, when a liquidity already exist", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.addLiquidity(liquidityA, liquidityB);
            const sharesBefore2ndLiquidity = Number(await cfmm.getShares());
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.addLiquidity(liquidityA, liquidityB);
            
            const totalSharesSupply = Number(await cfmm.totalSharesSupply());
            const reserveA = Number(await cfmm.reserveA());
            const reserveB = Number(await cfmm.reserveB());
             // calculate shares by the formula dx * T /x = dy * T / y
            const expectedShares = Math.floor(Math.min(
                (liquidityA * totalSharesSupply) / reserveA,
                (liquidityB * totalSharesSupply) / reserveB
            )) + sharesBefore2ndLiquidity;
            const actualShares = await cfmm.getShares();
            expect(expectedShares).to.equal(actualShares);
        });

        it("Revert if assets ratio changed", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.addLiquidity(liquidityA, liquidityB);
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await expect(cfmm.addLiquidity(500, 1000)).to.be.revertedWithCustomError(
                cfmm, "CFMM_AssetsRatioCanNotBeChanged"
            );
        });
        
        it("Revert if assets ratio changed", async () => {
            await expect(cfmm.addLiquidity(0, 0)).to.be.revertedWithCustomError(
                cfmm, "CFMM_NotEnoughLiquidity"
            ); 
        });
    });

    describe("Withdraw liquidity tests", () => {
        let liquidityA, liquidityB;

        beforeEach("Set up liquidity", async() => {
            liquidityA = 1000;
            liquidityB = 500;
        })
        
        it("Withdraw liquidity and update shares balance", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.addLiquidity(liquidityA, liquidityB);
            const shares = await cfmm.getShares();
            await cfmm.withdrawLiquidity(shares);
            expect(await cfmm.getShares()).to.equal(0);
        });
 
        it("Withdraw liquidity and update reserves", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.addLiquidity(liquidityA, liquidityB);
            const [reserveAbefore, reserveBbefore] = await cfmm.getReserves();
            const shares = Number(await cfmm.getShares());
            const totalSharesSupply = Number(await cfmm.totalSharesSupply());
            const balanceTokenA = Number(await tokenA.balanceOf(process.env.CFMM_LOCAL_ADDRESS));
            const balanceTokenB = Number(await tokenB.balanceOf(process.env.CFMM_LOCAL_ADDRESS));
            const expectedTokenAreturnedAmount = (balanceTokenA * shares) / totalSharesSupply;
            const expectedTokenBreturnedAmount = balanceTokenB * shares / totalSharesSupply;
            await cfmm.withdrawLiquidity(shares);
            const [reserveAafter, reserveBafter] = await cfmm.getReserves();
            expect(Number(reserveAafter)).to.equal(Number(reserveAbefore) - expectedTokenAreturnedAmount);
            expect(Number(reserveBafter)).to.equal(Number(reserveBbefore) - expectedTokenBreturnedAmount);
        });
        
        it("Withdraw liquidityand and update totalSharesSupply", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.connect(alice).addLiquidity(liquidityA, liquidityB);
            await mint_approve(tokenA, tokenB, 2000, 1000, bob);
            await cfmm.connect(bob).addLiquidity(2000, 1000);
            const aliceShares = Number(await cfmm.connect(alice).getShares());
            const totalSharesSupplyBeforeWithdraw = Number(await cfmm.totalSharesSupply());
            await cfmm.connect(alice).withdrawLiquidity(aliceShares);
            expect(await cfmm.totalSharesSupply()).to.equal(totalSharesSupplyBeforeWithdraw - aliceShares);
        });

        it("Revert if not enough shares provided for withdraw", async () => {
            await expect(cfmm.withdrawLiquidity(0)).to.be.revertedWithCustomError(
                cfmm, "CFMM_NotEnoughShares"
            );
        });
    });

    describe("Swap liquidity tests", () => {
        let liquidityA, liquidityB;

        beforeEach("Set up liquidity", async() => {
            liquidityA = 1000;
            liquidityB = 500;
        })
        
        it("Swap tokenA for tokenB", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.connect(alice).addLiquidity(liquidityA, liquidityB);
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB, bob);
            
            const feePercentage = 0.3;
            const amountIn = 500;
            const fee = (amountIn * feePercentage) / 100;
            const amountInAfterFee = amountIn - fee;
            
            const reserveIn = Number(await cfmm.reserveA());
            const reserveOut = Number(await cfmm.reserveB());
            const bobTokenBbalanceBeforeSwap = Number(await tokenB.connect(bob).balanceOf(bob.address));
            const bobCalculatedAmountOut = Math.floor((reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee));
            await cfmm.connect(bob).swap(tokenA.target, amountIn);
            const bobTokenBbalanceAftereSwap = Number(await tokenB.connect(bob).balanceOf(bob.address))
            expect(bobTokenBbalanceAftereSwap).to.equal(bobTokenBbalanceBeforeSwap + bobCalculatedAmountOut);
        });

        it("Update reserves after swap", async () => {
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB);
            await cfmm.connect(alice).addLiquidity(liquidityA, liquidityB);
            await mint_approve(tokenA, tokenB, liquidityA, liquidityB, bob);

            const feePercentage = 0.3;
            const amountIn = 500;
            const fee = (amountIn * feePercentage) / 100;
            const amountInAfterFee = amountIn - fee;
            
            const reserveIn = Number(await cfmm.reserveA());
            const reserveOut = Number(await cfmm.reserveB());
            const bobCalculatedAmountOut = Math.floor((reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee));
            await cfmm.connect(bob).swap(tokenA.target, amountIn);
            expect(await cfmm.reserveA()).to.equal(reserveIn + amountIn);
            expect(await cfmm.reserveB()).to.equal(reserveOut - bobCalculatedAmountOut);
        });

        it("Revert if tokenIn is usupported address", async () => {
            const amountIn = 500;
            const unsupportedTokenAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
            await expect(cfmm.swap(unsupportedTokenAddress, amountIn)).to.be.revertedWithCustomError(
                cfmm, "CFMM_UnsupportedTokenAddress"
            );
        });

        it("Revert if amountIn is not enough", async () => {
            const amountIn = 0;
            await expect(cfmm.swap(tokenA.target, amountIn)).to.be.revertedWithCustomError(
                cfmm, "CFMM_InsufficientAmountIn"
            );
        });
    });
})