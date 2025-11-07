const express = require('express');
const { ethers } = require('hardhat');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Hardhat
async function initializeHardhat() {
    try {
        // Get the contract factory
        const TransferToken = await ethers.getContractFactory("TransferToken");

        // Deploy the contract
        console.log("Deploying TransferToken...");
        const token = await TransferToken.deploy(ethers.parseEther("1000000"));
        await token.waitForDeployment();
        const contractAddress = await token.getAddress();

        console.log("TransferToken deployed to:", contractAddress);
        return { token, contractAddress };
    } catch (error) {
        console.error("Error initializing Hardhat:", error);
        return null;
    }
}

// Global contract instance
let contractInstance = null;
let contractAddress = null;

// Initialize on server start
initializeHardhat().then((result) => {
    if (result) {
        contractInstance = result.token;
        contractAddress = result.contractAddress;
    }
});

// API Routes

// Get contract information
app.get('/api/contract', (req, res) => {
    const network = req.query.network;
    if (!contractAddress) {
        return res.status(500).json({ error: 'Contract not deployed yet' });
    }

    // For now, return the same contract for all networks
    // In production, you might have different contracts per network
    res.json({
        address: contractAddress,
        abi: require('./artifacts/contracts/TransferToken.sol/TransferToken.json').abi,
        network: network || 'unknown'
    });
});

// Get token balance
app.get('/api/balance/:address', async (req, res) => {
    try {
        if (!contractInstance) {
            return res.status(500).json({ error: 'Contract not initialized' });
        }

        const balance = await contractInstance.balanceOf(req.params.address);
        res.json({ balance: ethers.formatEther(balance) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get contract owner
app.get('/api/owner', async (req, res) => {
    try {
        if (!contractInstance) {
            return res.status(500).json({ error: 'Contract not initialized' });
        }

        const owner = await contractInstance.owner();
        res.json({ owner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Transfer tokens (requires signed transaction from frontend)
app.post('/api/transfer', async (req, res) => {
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
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        contractDeployed: !!contractAddress,
        contractAddress
    });
});

// Serve static files (for the HTML UI and Vue frontend)
app.use(express.static('.'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
