const { expect } = require("chai");
const { network } = require("hardhat");
const { devNetworks, getContractInstance, getSigner } = require("../../utils/helpers/helper-hardhat");
require("dotenv").config();
const networkName = network.name;


!devNetworks.includes(networkName)
? describe.skip
:describe("Testing CFMM contract", function() {
   let contract, signer2

    beforeEach("Set up a contract for testing", async () => {
        contract = await getContractInstance(networkName, 'CFMM');
        signer2 = await getSigner(networkName, process.env.PRIVATE_KEY_LOCAL2);
    });

    describe("Constructor tests", () => {
        it("Constructor sucessfully initialised", async () => {
            expect(await contract.tokenA()).to.equal(process.env.TOKEN_A_LOCAL_ADDRESS);
            expect(await contract.tokenB()).to.equal(process.env.TOKEN_B_LOCAL_ADDRESS);
        });
    });
})