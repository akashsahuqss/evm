const { ethers } = require('hardhat');

let contractInstances = {}; // per network
let contractAddresses = {}; // per network
let deployedTokens = {}; // per network

const networkConfigs = {
    localhost: {
        rpcUrl: process.env.GANACHE_URL || "http://127.0.0.1:7545",
        privateKey: process.env.GANACHE_PRIVATE_KEY
    },
    sepolia: {
        rpcUrl: process.env.SEPOLIA_RPC_URL,
        privateKey: process.env.SEPOLIA_PRIVATE_KEY
    },
    holesky: {
        rpcUrl: process.env.HOLESKY_RPC_URL,
        privateKey: process.env.HOLESKY_PRIVATE_KEY
    }
};

async function getProviderAndSigner(network) {
    const config = networkConfigs[network];
    if (!config) {
        throw new Error(`Unsupported network: ${network}`);
    }
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);
    return { provider, signer };
}

async function deployContractForNetwork(network) {
    try {
        const { signer } = await getProviderAndSigner(network);
        const TransferToken = await ethers.getContractFactory("TransferToken", signer);
        console.log(`Deploying TransferToken on ${network}...`);
        const token = await TransferToken.deploy(ethers.parseEther("1000000"));
        await token.waitForDeployment();
        const address = await token.getAddress();
        console.log(`TransferToken deployed on ${network} to:`, address);
        contractInstances[network] = token;
        contractAddresses[network] = address;
        return { token, address };
    } catch (error) {
        console.error(`Error deploying on ${network}:`, error);
        return null;
    }
}

async function getContractInstance(network) {
    if (!contractInstances[network]) {
        await deployContractForNetwork(network);
    }
    return contractInstances[network];
}

function getContractAddress(network) {
    return contractAddresses[network];
}

function getDeployedTokens(network) {
    if (!deployedTokens[network]) {
        deployedTokens[network] = [];
    }
    return deployedTokens[network];
}

function addDeployedToken(network, tokenData) {
    if (!deployedTokens[network]) {
        deployedTokens[network] = [];
    }
    deployedTokens[network].push(tokenData);
}

async function initializeHardhat() {
    // Initialize for localhost by default
    const result = await deployContractForNetwork('localhost');
    return result;
}

module.exports = {
    initializeHardhat,
    getContractInstance,
    getContractAddress,
    getDeployedTokens,
    addDeployedToken,
    getProviderAndSigner,
    deployContractForNetwork
};
