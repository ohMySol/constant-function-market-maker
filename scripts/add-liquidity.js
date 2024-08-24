const { network } = require("hardhat")
const { getContractInstance } = require("../utils/helpers/helper-hardhat")
require("dotenv").config()
const networkName = network.name
const liquidityA = 1000 // feel free to change for your amount.
const liquidityB = 500 // feel free to change for your amount.

const add_liquidity = async() => {
    const contract = await getContractInstance(networkName, 'CFMM')

    await contract.addLiquidity(liquidityA, liquidityB)
    const shares = await contract.getShares()

    console.log(`\nSuccessfully deposited liquidity in amount of: ${liquidityA} tokenA, ${liquidityB} tokenB.`)
    console.log(`Your shares amount is: ${shares}.`)
}

add_liquidity().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});