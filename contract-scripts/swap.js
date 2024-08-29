const { network } = require("hardhat");
const { getContractInstance, getSigner, getNetworkConfig } = require("../utils/helpers/helper-hardhat");
const { NonceManager } = require("ethers");
require("dotenv").config();
const networkName = network.name;
const amountIn = 500; // Feel free to set up your amount.

const swap = async() => {
    const config = await getNetworkConfig(networkName);
    const signer = await getSigner(networkName, process.env.PRIVATE_KEY_LOCAL2);
    const managedSigner = new NonceManager(signer);
    // Connect new signer to diffirintiate user from LP.
    const contract = (await getContractInstance(networkName, 'CFMM')).connect(managedSigner);
    const tokenA = (await getContractInstance(networkName, 'TokenA')).connect(managedSigner);
    const reserveBbeforeSwap = await contract.reserveB();
    
    await tokenA.mint(amountIn);
    await tokenA.approve(config.contracts['CFMM'], amountIn);
    
    // TokenA will be 'In' token, so TokenB will be 'out' token.
    await contract.swap(config.contracts['TokenA'], amountIn);
    const amountOut = reserveBbeforeSwap - (await contract.reserveB());
    console.log(`\nYour calculated out amount: ${amountOut}`);
}

swap().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});