# Constant Function Market Maker(CFMM).
This project showing implementation of the constant product market maker(CPMM) which on the types of the general automated market maker(AMM) type - constant function market maker(CFMM).

## How the logic works?
1. User can add liquidity to AMM liquidity pool, and receive a shares(liquidity provider tokens), as a liquidity provider(LP). 

2. Then user can also do a swaps between token pair(TokenA, TokenB).

3. LP can withdraw his liquidity from the AMM.

## Technology Stack & Tools
- Solidity (Writing Smart Contracts)
- Javascript (Testing/Scripting)
- [Hardhat](https://hardhat.org/) (Development Framework)
- [Ethers.js](https://docs.ethers.io/v5/) (Blockchain Interaction)
- [Mocha](https://www.npmjs.com/package/mocha) (Testing Framework)
- [env-enc](https://github.com/smartcontractkit/env-enc) (Encrypted storage of private data)

## Setting Up The Project
### 1. Clone/Download the Repository.
`git clone https://github.com/ohMySol/ecdsa-payment-verification.git`

### 2. Install Dependencies.
`npm install`

### 3. Set up .env and .env.enc files.
1. Make sure all the **.env** and **.env.enc** variables are set correctly. For more info about variables check the **.env.example** and **.env.enc.example** files.
Also, here is a guide, how to install env-enc and how to use it: [env-enc-guide](https://github.com/smartcontractkit/env-enc)

## Running The Project(localhost)
### 1. Start a localhost node.
1.1 Run command `npm run node`. This command will spin up a new isolated hardhat network(localhost).

### 2. Mint and approve tokens as a liquidity provider.
2.1 Run command `npm run mint-approve localhost`. This will automatically mint and approve 1000 tokenA and 1000 tokenB for your user. (Feel free to change values for mint-approve).

### 3. Add liquidity to AMM liquidity pool.
3.1 Run command `npm run add-liquidity localhost`. This will add a liquidity to the protocol in ratio 1000 tokenA: 500 tokenB. (Feel free to change values for liquidity).

### 4. Swap tokens.
4.1 Run command `npm run swap localhost`. TokenA is set as IN token for the swap. This will swap your 500 tokenA for calculated amount of tokenB. (Feel free to change values for swap, and IN token also).

### 5. Withdraw liquidity.
5.1 Run command `npm run withdraw-liquidity localhost`. This will withdraw your tokenA and tokenB liquidity from the AMM back to user balance. Keep in mind if you did already a swap before withdrawing a liquidity, then you'll receive back new values calculated based on your shares amount and reserves in the liquidity pool.

## Running The Project(tenderly virtual network)
### 1. Start a local node.
1.1 Run command `npm run node`.

### 2. Verify that you prepared a tenderly virtual network config in hardhat.config.js.
2.1 You should create a project in Tenderly first. Then you should create a tenderly virtual network and copy API_KEY of this network to .env.enc file.

2.2 In your **hardhat.config.js** file make sure you added this:
```
virtual_mainnet: {
      url: `https://virtual.mainnet.rpc.tenderly.co/${process.env.TENDERLY_MAINNET_API_KEY}`,
      chainId: your custom chain id, 
      currency: "VETH"
},
tenderly: {
    project: "name of your peoject",
    username: "your user name",
  }
```

2.2 Now you ready to run interract with the contracts in tenderly virtual network.

### 2. Mint and approve tokens as a liquidity provider.
2.1 Run command `npm run mint-approve virtual_mainnet`. This will automatically mint and approve 1000 tokenA and 1000 tokenB for your user. (Feel free to change values for mint-approve).

### 3. Add liquidity to AMM liquidity pool.
3.1 Run command `npm run add-liquidity virtual_mainnet`. This will add a liquidity to the protocol in ratio 1000 tokenA: 500 tokenB. (Feel free to change values for liquidity).

### 4. Swap tokens.
4.1 Run command `npm run swap virtual_mainnet`. TokenA is set as IN token for the swap. This will swap your 500 tokenA for calculated amount of tokenB. (Feel free to change values for swap, and IN token also).

### 5. Withdraw liquidity.
5.1 Run command `npm run withdraw-liquidity virtual_mainnet`. This will withdraw your tokenA and tokenB liquidity from the AMM back to user balance. Keep in mind if you did already a swap before withdrawing a liquidity, then you'll receive back new values calculated based on your shares amount and reserves in the liquidity pool.

## Running The Tests(hardhat)
1. Before running tests make sure that .env file set up correctly with all required variables.

2. Run command `npm run ht`

## Deploy to Testnet(Sepolia)
1. First deploy tokens(TokenA, TokenB), becasue their addresses you will need for CFMM deployment. Run command `npx hardhat deploy --network sepolia --tags token`.

2. Take addresses of the deployed token contracts and paste them to .env file to **TOKEN_A_SEPOLIA_ADDRESS=** and **TOKEN_B_SEPOLIA_ADDRESS=** variables. Then during the CFMM deployment, a deploy script will take from .env file these addresses for the constructor.

3. Now deploy CFMM contract. Run command `npx hardhat deploy --network sepolia --tags amm`. This will deploy CFMM contract to Sepolia network.

4. Play with your contracts in Etherscan.