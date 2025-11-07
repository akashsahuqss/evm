const express = require('express');
const { ethers } = require('hardhat');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Import routes
const paymentRoutes = require('./src/routes/paymentRoutes');

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

// Get native balance (ETH)
app.get('/api/native-balance/:address', async (req, res) => {
    try {
        console.log(`Fetching native balance for address: ${req.params.address}`);
        const balance = await ethers.provider.getBalance(req.params.address);
        console.log(`Native balance: ${ethers.formatEther(balance)} ETH`);
        res.json({ balance: ethers.formatEther(balance) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction history
app.get('/api/transactions/:address', async (req, res) => {
    try {
        const address = req.params.address;
        const network = req.query.network || 'sepolia'; // default to sepolia

        if (network === 'localhost') {
            // For local Hardhat network, fetch recent transactions
            const latestBlock = await ethers.provider.getBlockNumber();
            const fromBlock = Math.max(0, latestBlock - 100); // last 100 blocks

            const logs = await ethers.provider.getLogs({
                fromBlock,
                toBlock: latestBlock,
                address: address
            });

            const transactions = await Promise.all(logs.map(async (log) => {
                const tx = await ethers.provider.getTransaction(log.transactionHash);
                return {
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: ethers.formatEther(tx.value),
                    blockNumber: tx.blockNumber,
                    timestamp: (await ethers.provider.getBlock(tx.blockNumber)).timestamp
                };
            }));

            res.json({ transactions });
        } else {
            // For testnets, use Etherscan API
            const apiKey = process.env.ETHERSCAN_API_KEY;
            if (!apiKey) {
                return res.status(500).json({ error: 'Etherscan API key not configured' });
            }

            const baseUrl = network === 'sepolia' ? 'https://api-sepolia.etherscan.io' : 'https://api-holesky.etherscan.io';
            const url = `${baseUrl}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === '1') {
                const transactions = data.result.slice(0, 10).map(tx => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: ethers.formatEther(tx.value),
                    blockNumber: parseInt(tx.blockNumber),
                    timestamp: parseInt(tx.timeStamp)
                }));
                res.json({ transactions });
            } else {
                res.status(500).json({ error: data.message });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deploy a new ERC20 token
app.post('/api/deploy-token', async (req, res) => {
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

        res.json({
            success: true,
            address: deployedAddress,
            name,
            symbol,
            initialSupply,
            abi: require('../artifacts/contracts/TransferToken.sol/TransferToken.json').abi
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
        abi: require('../artifacts/contracts/TransferToken.sol/TransferToken.json').abi,
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

// Use payment routes
app.use('/api/nowpayments', paymentRoutes);

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
