const { expect } = require("chai");
const { network} = require("hardhat");
const { devNetworks, getContractInstance, getSigner } = require("../../utils/helpers/helper-hardhat");
require("dotenv").config();
const networkName = network.name;

!devNetworks.includes(networkName)
? describe.skip
:describe("Testing TokenB contract", function() {
   let contract, signer2

    beforeEach("Set up a contract for testing", async () => {
        contract = await getContractInstance(networkName, 'TokenB');
        signer2 = await getSigner(networkName, process.env.PRIVATE_KEY_LOCAL2);
    });

    describe("Constructor tests", () => {
        it("Constructor sucessfully initialised", async () => {
            expect(await contract.name()).to.equal("TokenB");
            expect(await contract.symbol()).to.equal("TB");
        });
    });

    describe("Mint function tests", () => {
        it("Mint tokens", async () => {
            const signer = await getSigner(networkName);
            await contract.mint(1000);
            expect(await contract.balanceOf(signer.address)).to.equal(1000);
            expect(await contract.totalSupply()).to.equal(1000);
        });
    });

    describe("Approve function tests", () => {
        it("Approve tokens", async () => {
            const signer = await getSigner(networkName);
            const spender = signer2.address;
            await contract.approve(spender, 1000);
            expect(await contract.allowance(signer.address, spender)).to.equal(1000);
        });
    });

    describe("TransferFrom function tests", () => {
        it("TransferFrom tokens", async () => {
            const signer = await getSigner(networkName);
            const spender = signer2.address;
            await contract.connect(signer2).transferFrom(signer.address, spender, 500);
            expect(await contract.balanceOf(signer.address)).to.equal(500);
            expect(await contract.balanceOf(spender)).to.equal(500);
            expect(await contract.allowance(signer.address, spender)).to.equal(500);
        });
    });
})