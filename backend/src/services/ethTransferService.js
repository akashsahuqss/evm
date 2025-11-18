const { ethers } = require('hardhat');

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
    if (!config.privateKey) {
        throw new Error(`Private key not configured for network: ${network}`);
    }
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);
    return { provider, signer };
}

async function sendEther(recipient, amountInEther, network = 'localhost') {
    try {
        const { provider, signer } = await getProviderAndSigner(network);

        // Validate inputs
        if (!ethers.isAddress(recipient)) {
            throw new Error('Invalid recipient address');
        }

        const amountInWei = ethers.parseEther(amountInEther.toString());
        if (amountInWei <= 0n) {
            throw new Error('Amount must be positive');
        }

        // Check sender balance
        const balance = await provider.getBalance(signer.address);
        if (balance < amountInWei) {
            throw new Error('Insufficient balance');
        }

        // Send transaction
        console.log(`Sending ${amountInEther} ETH to ${recipient} on ${network}...`);
        const tx = await signer.sendTransaction({
            to: recipient,
            value: amountInWei
        });

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`Transaction confirmed: ${receipt.hash}`);

        return {
            success: true,
            transactionHash: receipt.hash,
            from: signer.address,
            to: recipient,
            amount: amountInEther
        };
    } catch (error) {
        console.error('Error sending ETH:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sendEther
};
