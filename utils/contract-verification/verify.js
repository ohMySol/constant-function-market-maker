const { run } = require("hardhat")

const verify = async (contractAddress, contractArguments) => {
    console.log("============ Verifying contract... ============")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: contractArguments
        })
        console.log("============ Successfully verified! ============")
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("============ Already verified! ============")
        } else {
            console.log(e)
        }
    }
}

// Function for automatic contract verification after deployment to tenderly virtual network.
const tenderlyVerify = async(contractName, contractAddress) => {
    await tenderly.verify({
        name: contractName,
        address: contractAddress
    })
}

module.exports = {
    verify,
    tenderlyVerify
}