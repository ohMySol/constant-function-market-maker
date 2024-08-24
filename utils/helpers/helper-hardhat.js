const { ethers, JsonRpcProvider } = require("ethers");
require("@chainlink/env-enc").config();
require("dotenv").config()
const fsp = require('fs/promises')

/*
1. This is the file with the helper configs and helper functions
which you can use across your scripts/tests in order to write less code.
All this code, incapsulated in this module, will help you dynamically
deploy, write to contract, read from the contract, create providers,
signers and contracts instances DYNAMICALLY based on the network you are.
*/

// For local testing.
const devNetworks = ["localhost", "hardhat"]

/* 
 Config object with all necessary data and functions to create:
 contract instance, create signer object, provider instance...,
 based on the network you are. 
*/
const networkConfig = {
    hardhat: {
        blockConfirmations: 1,
        provider: () => new JsonRpcProvider(),
        signer: () => new ethers.Wallet(
            networkConfig.hardhat.privateKey, networkConfig.hardhat.provider()
        ),
        privateKey: process.env.PRIVATE_KEY_LOCAL,
        contracts: {
            CFMM: process.env.CFMM_LOCAL_ADDRESS,
            TokenA: process.env.TOKEN_A_LOCAL_ADDRESS,
            TokenB: process.env.TOKEN_B_LOCAL_ADDRESS
        },
        chainId: 31337
    },
    localhost: {
        blockConfirmations: 1,
        provider: () => new JsonRpcProvider(`http://127.0.0.1:8545`),
        signer: () => new ethers.Wallet(
            networkConfig.localhost.privateKey, networkConfig.localhost.provider()
        ),
        privateKey: process.env.PRIVATE_KEY_LOCAL,
        contracts: {
            CFMM: process.env.CFMM_LOCAL_ADDRESS,
            TokenA: process.env.TOKEN_A_LOCAL_ADDRESS,
            TokenB: process.env.TOKEN_B_LOCAL_ADDRESS
        },
        chainId: 1337
    },
    virtual_mainnet: {
        blockConfirmations: 1,
        provider: () => new JsonRpcProvider(
            `https://virtual.mainnet.rpc.tenderly.co/${process.env.TENDERLY_MAINNET_API_KEY}`
        ),
        signer: () => new ethers.Wallet(
            networkConfig.virtual_mainnet.privateKey, networkConfig.virtual_mainnet.provider()
        ),
        privateKey: process.env.PRIVATE_KEY_LOCAL,
        contracts: {
            CFMM: process.env.CFMM_TENDERLY_ADDRES,
            TokenA: process.env.TOKEN_A_TENDERLY_ADDRESS,
            TokenB: process.env.TOKEN_B_TENDERLY_ADDRESS
        },
        chainId: 7295
    },
    sepolia: {
        blockConfirmations: 6,
        provider: () => new JsonRpcProvider(
            `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
        ),
        signer: () => new ethers.Wallet(
            networkConfig.sepolia.privateKey, networkConfig.sepolia.provider()
        ),
        privateKey: process.env.PRIVATE_KEY,
        contracts: {
            CFMM: process.env.CFMM_SEPOLIA_ADDRESS,
            TokenA: process.env.TOKEN_A_SEPOLIA_ADDRESS,
            TokenB: process.env.TOKEN_B_SEPOLIA_ADDRESS
        },
        chainId: 11155111
    }
}

// Returns the config object for specific 'networkName'.
const getNetworkConfig = async(networkName) => {
    const config = networkConfig[networkName]
    if (!config) {
        throw Error(`Unsupported network: ${networkName}`)
    }
    return config
}

// Returns a 'contractName' instance on the specific 'networkName'.
getContractInstance = async(networkName, contractName) => {
    const config = await getNetworkConfig(networkName)
    const data = JSON.parse(await fsp.readFile(`./artifacts/contracts/${contractName}.sol/${contractName}.json`, "utf8"))
    const abi = data.abi
    const contractAddress = config.contracts[contractName]

    if (!contractAddress) {
        throw Error(`Unsupported contract address: ${contractAddress}`)
    }
    const contract = new ethers.Contract(contractAddress, abi, config.signer())
    return contract 
}

getSigner = async(networkName, privateKey) => {
    const config = await getNetworkConfig(networkName)
    // If privateKey is provided, create a new signer with it
    if (privateKey) {
        return new ethers.Wallet(privateKey, config.provider());
    } else {
        //Otherwise, use the pre-initialized signer from the config
        return config.signer(); 
    }
}

module.exports = {
    devNetworks,
    networkConfig,
    getNetworkConfig,
    getContractInstance,
    getSigner
}