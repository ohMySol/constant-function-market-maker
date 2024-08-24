const { network } = require("hardhat")
const { devNetworks, getNetworkConfig } = require("../utils/helpers/helper-hardhat")
const { verify, tenderlyVerify } = require("../utils/contract-verification/verify")
require("dotenv").config()

module.exports = async({deployments, getNamedAccounts}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const networkName = network.name
    const config = await getNetworkConfig(networkName)
    const contractName = "CFMM"

        log(`\n============ Deploying ${contractName} contract to ${networkName} network ============\n`)
        
        const contract = await deploy(contractName, {
            from: deployer,
            log: true,
            args: [config.contracts['TokenA'], config.contracts['TokenB']],
            blockConfirmations: config.blockConfirmations
        })
    
        log(`\n============ Contract deployed to: ${contract.address}  ============\n`)
        
        if (!devNetworks.includes(networkName) && process.env.ETHERSCAN_API_KEY) {
            networkName == "sepolia"
            ? await verify(contract.address, contract.args)
            : await tenderlyVerify(contractName, contract.address)
        } else {
            log(`You are on the local network, no verification required!\n`)
        }
}

module.exports.tags = ["amm", "all"]