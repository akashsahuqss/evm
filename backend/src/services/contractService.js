const { ethers } = require('hardhat');

let contractInstance = null;
let contractAddress = null;
let deployedTokens = [];

async function initializeHardhat() {
    try {
        // Connect to Ganache network
        const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");
        const signer = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY, provider);

         // const provider = new ethers.JsonRpcProvider(process.env.HOLESKY_RPC_URL);
        // const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        // Get the contract factory
        const TransferToken = await ethers.getContractFactory("TransferToken", signer);

        // Deploy the contract
        console.log("Deploying TransferToken...");
        const token = await TransferToken.deploy(ethers.parseEther("1000000"));
        await token.waitForDeployment();
        const address = await token.getAddress();

        console.log("TransferToken deployed to:", address);

        contractInstance = token;
        contractAddress = address;

        return { token, address, provider };
    } catch (error) {
        console.error("Error initializing Hardhat:", error);
        return null;
    }
}

function addDeployedToken(tokenData) {
    deployedTokens.push(tokenData);
}

module.exports = {
    initializeHardhat,
    getContractInstance: () => contractInstance,
    getContractAddress: () => contractAddress,
    getDeployedTokens: () => deployedTokens,
    addDeployedToken
};
