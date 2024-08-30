const { ethers } = require("hardhat");

const mint_approve = async(tokenA, tokenB, liquidityA, liquidityB, user) => {
    [alice] = await ethers.getSigners();
    if (!user) {
        user = alice;
    };
    await tokenA.connect(user).mint(liquidityA);
    await tokenB.connect(user).mint(liquidityB);
    await tokenA.connect(user).approve(process.env.CFMM_LOCAL_ADDRESS, liquidityA);
    await tokenB.connect(user).approve(process.env.CFMM_LOCAL_ADDRESS, liquidityB);
}

module.exports = {
    mint_approve
}