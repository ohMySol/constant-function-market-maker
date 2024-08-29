const { network } = require("hardhat");
const { getContractInstance, getSigner, getNetworkConfig } = require("../utils/helpers/helper-hardhat");
const { NonceManager } = require("ethers");
require("dotenv").config();
const networkName = network.name;
const mintAmount = 1000; // Feel free to set up your mint amount.

const mint_approve = async() => {
    const config = await getNetworkConfig(networkName);
    const signer = await getSigner(networkName);
    const managedSigner = new NonceManager(signer);
    const spender = config.contracts['CFMM'];
    const tokenA = (await getContractInstance(networkName, 'TokenA')).connect(managedSigner);
    const tokenB = (await getContractInstance(networkName, 'TokenB')).connect(managedSigner);
    
    await tokenA.mint(mintAmount);
    await tokenB.mint(mintAmount);

    console.log(`\nMint ${mintAmount} tokenA for ${signer.address}`);
    console.log(`Mint ${mintAmount} tokenB for ${signer.address}`); 
    
    await tokenA.approve(spender, mintAmount);
    await tokenB.approve(spender, mintAmount);

    console.log(
        `\nSet allowance ${await tokenA.allowance(signer, spender)} from ${signer.address} to ${spender} for tokenA`
    );
    console.log(
        `Set allowance ${await tokenB.allowance(signer, spender)} from ${signer.address} to ${spender} for tokenA`
    );
};

mint_approve().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});