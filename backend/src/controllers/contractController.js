const { ethers } = require('hardhat');
const { getContractInstance, getContractAddress, getDeployedTokens, addDeployedToken } = require('../services/contractService');

// Deploy a new ERC20 token
const deployToken = async (req, res) => {
    try {
        const { name, symbol, initialSupply } = req.body;

        if (!name || !symbol || !initialSupply) {
            return res.status(400).json({ error: 'Name, symbol, and initialSupply are required' });
        }

        // Create a new contract factory for a generic ERC20
        const GenericERC20 = await ethers.getContractFactory("TransferToken");

        console.log(`Deploying ${name} (${symbol}) with supply ${initialSupply}...`);
        const token = await GenericERC20.deploy(ethers.parseEther(initialSupply.toString()));
        await token.waitForDeployment();
        const deployedAddress = await token.getAddress();

        console.log(`${name} deployed to:`, deployedAddress);

        const tokenData = {
            success: true,
            address: deployedAddress,
            name,
            symbol,
            initialSupply,
            abi: require('../../../artifacts/contracts/TransferToken.sol/TransferToken.json').abi
        };

        // Store deployed token
        addDeployedToken(tokenData);

        res.json(tokenData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get list of deployed tokens
const getDeployedTokensList = (req, res) => {
    res.json({ tokens: getDeployedTokens() });
};

// Get contract information
const getContractInfo = (req, res) => {
    const address = getContractAddress();
    if (!address) {
        return res.status(500).json({ error: 'Contract not deployed yet' });
    }

    // For now, return the same contract for all networks
    // In production, you might have different contracts per network
    res.json({
        address,
        abi: require('../../../artifacts/contracts/TransferToken.sol/TransferToken.json').abi,
        network: req.query.network || 'unknown'
    });
};

// Get token balance
const getTokenBalance = async (req, res) => {
    try {
        const contract = getContractInstance();
        if (!contract) {
            return res.status(500).json({ error: 'Contract not initialized' });
        }

        const balance = await contract.balanceOf(req.params.address);
        res.json({ balance: ethers.formatEther(balance) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get contract owner
const getContractOwner = async (req, res) => {
    try {
        const contract = getContractInstance();
        if (!contract) {
            return res.status(500).json({ error: 'Contract not initialized' });
        }

        const owner = await contract.owner();
        res.json({ owner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Transfer tokens from owner to user (for initial token distribution)
const transferToUser = async (req, res) => {
    try {
        const { userAddress, amount } = req.body;

        if (!userAddress || !amount) {
            return res.status(400).json({ error: 'User address and amount are required' });
        }

        const contract = getContractInstance();
        if (!contract) {
            return res.status(500).json({ error: 'Contract not initialized' });
        }

        // Transfer tokens from owner to user
        const tx = await contract.secureTransfer(userAddress, ethers.parseEther(amount.toString()));
        await tx.wait();

        res.json({
            success: true,
            txHash: tx.hash,
            amount: amount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Transfer tokens (requires signed transaction from frontend)
const transferTokens = async (req, res) => {
    try {
        const { signedTx } = req.body;

        if (!signedTx) {
            return res.status(400).json({ error: 'Signed transaction required' });
        }

        // Send the signed transaction
        const tx = await ethers.provider.sendTransaction(signedTx);
        await tx.wait();

        res.json({
            success: true,
            txHash: tx.hash,
            blockNumber: tx.blockNumber
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    deployToken,
    getDeployedTokensList,
    getContractInfo,
    getTokenBalance,
    getContractOwner,
    transferToUser,
    transferTokens
};
