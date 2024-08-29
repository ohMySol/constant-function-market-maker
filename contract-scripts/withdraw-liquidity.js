const { network } = require("hardhat");
const { getContractInstance } = require("../utils/helpers/helper-hardhat");
require("dotenv").config();
const networkName = network.name;

const wihtdraw_liquidity = async() => {
    const contract = await getContractInstance(networkName, 'CFMM');
    const sharesAmount =  await contract.getShares();
    const [reserveAbefore, reserveBbefore] = await contract.getReserves();
     
    console.log(`\nReserves before withdrawal: reserveA(${reserveAbefore}), reserveB(${reserveBbefore})`);
    await contract.withdrawLiquidity(sharesAmount);
    const [reserveAafter, reserveBafter] = await contract.getReserves();
    console.log(`Reserves after withdrawal: reserveA(${reserveAafter}), reserveB(${reserveBafter})`);
    console.log(`Your shares amount after liquidity withdrawal: ${await contract.getShares()}`);
};

wihtdraw_liquidity().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});