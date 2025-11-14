const { ethers } = require('hardhat');
const { getContractInstance, getContractAddress, getDeployedTokens, addDeployedToken, getProviderAndSigner, deployContractForNetwork } = require('../services/contractService');

// Deploy a new ERC20 token
const deployToken = async (req, res) => {
    try {
        const { name, symbol, initialSupply } = req.body;
        const network = req.query.network || 'localhost';

        if (!name || !symbol || !initialSupply) {
            return res.status(400).json({ error: 'Name, symbol, and initialSupply are required' });
        }

        const { signer } = await getProviderAndSigner(network);
        const GenericERC20 = await ethers.getContractFactory("TransferToken", signer);

        console.log(`Deploying ${name} (${symbol}) with supply ${initialSupply} on ${network}...`);
        const token = await GenericERC20.deploy(ethers.parseEther(initialSupply.toString()));
        await token.waitForDeployment();
        const deployedAddress = await token.getAddress();

        console.log(`${name} deployed on ${network} to:`, deployedAddress);

        const tokenData = {
            success: true,
            address: deployedAddress,
            name,
            symbol,
            initialSupply,
            network,
            abi: require('../../../artifacts/contracts/TransferToken.sol/TransferToken.json').abi
        };

        // Store deployed token
        addDeployedToken(network, tokenData);

        res.json(tokenData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get list of deployed tokens
const getDeployedTokensList = (req, res) => {
    const network = req.query.network || 'localhost';
    res.json({ tokens: getDeployedTokens(network) });
};

// Map chain IDs to network names
const chainIdToNetwork = {
    '1337': 'localhost',      // Ganache default
    '11155111': 'sepolia',    // Sepolia
    '17000': 'holesky'        // Holesky
};

// Get contract information
const getContractInfo = async (req, res) => {
    try {
        let network = req.query.network || 'localhost';

        // If network is a chain ID, map it to network name
        if (chainIdToNetwork[network]) {
            network = chainIdToNetwork[network];
        }

        let address = getContractAddress(network);

        // If contract not deployed on this network, deploy it
        if (!address) {
            console.log(`Contract not found on ${network}, deploying...`);
            const result = await deployContractForNetwork(network);
            if (result) {
                address = result.address;
            } else {
                return res.status(500).json({ error: 'Failed to deploy contract on this network' });
            }
        }

        res.json({
            address,
            abi: require('../../../artifacts/contracts/TransferToken.sol/TransferToken.json').abi,
            network
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
        const { recipientAddress, amount } = req.body;
        const network = req.query.network || 'localhost';

        if (!recipientAddress || !amount) {
            return res.status(400).json({ error: 'Recipient address and amount are required' });
        }

        const contract = await getContractInstance(network);
        if (!contract) {
            return res.status(500).json({ error: 'Contract not initialized' });
        }

        // Transfer tokens from owner to user
        const tx = await contract.secureTransfer(recipientAddress, ethers.parseEther(amount.toString()));
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
