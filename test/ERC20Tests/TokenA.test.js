const { expect } = require("chai");
const { ethers, deployments, network } = require("hardhat");
const { devNetworks } = require("../../utils/helpers/helper-hardhat");
require("dotenv").config();
const networkName = network.name;


!devNetworks.includes(networkName)
? describe.skip
:describe("Testing TokenA contract", function() {
   let Contract, contract, alice, bob

    beforeEach("Set up a contract for testing", async () => {
        [alice, bob] = await ethers.getSigners();
        await deployments.fixture(["token"]) 
        Contract = (await deployments.get("TokenA")).address;
        contract = await ethers.getContractAt("TokenA", Contract) 
    });

    describe("Constructor tests", () => {
        it("Constructor sucessfully initialised", async () => {
            expect(await contract.name()).to.equal("TokenA");
            expect(await contract.symbol()).to.equal("TA");
        });
    });

    describe("Mint function tests", () => {
        it("Mint tokens", async () => {
            const signer = alice.address;
            await contract.mint(1000);
            expect(await contract.balanceOf(signer)).to.equal(1000);
            expect(await contract.totalSupply()).to.equal(1000);
        });
    });

    describe("Approve function tests", () => {
        it("Approve tokens", async () => {
            const signer = alice.address;
            const spender = bob.address;
            await contract.approve(spender, 1000);
            expect(await contract.allowance(signer, spender)).to.equal(1000);
        });
    });

    describe("TransferFrom function tests", () => {
        it("TransferFrom tokens", async () => {
            const signer = alice.address;
            const spender = bob.address;
            await contract.mint(1000);
            await contract.approve(spender, 1000);
            await contract.connect(bob).transferFrom(signer, spender, 500);
            expect(await contract.balanceOf(signer)).to.equal(500);
            expect(await contract.balanceOf(spender)).to.equal(500);
            expect(await contract.allowance(signer, spender)).to.equal(500);
        });
    });
})