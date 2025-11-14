const { ethers } = require('hardhat');

// Get native balance (ETH)
const getNativeBalance = async (req, res) => {
    try {
        const network = req.query.network || 'localhost';
        console.log(`Fetching native balance for address: ${req.params.address} on ${network}`);

        let provider;
        if (network === 'localhost') {
            provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");
        } else if (network === 'sepolia') {
            provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        } else if (network === 'holesky') {
            provider = new ethers.JsonRpcProvider(process.env.HOLESKY_RPC_URL);
        } else {
            return res.status(400).json({ error: 'Unsupported network' });
        }

        const balance = await provider.getBalance(req.params.address);
        console.log(`Native balance: ${ethers.formatEther(balance)} ETH`);
        res.json({ balance: ethers.formatEther(balance) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const address = req.params.address;
        const network = req.query.network || 'sepolia'; // default to sepolia

        if (network === 'localhost') {
            // For Ganache network, fetch recent transactions
            const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, latestBlock - 100); // last 100 blocks

            const logs = await provider.getLogs({
                fromBlock,
                toBlock: latestBlock,
                address: address
            });

            const transactions = await Promise.all(logs.map(async (log) => {
                const tx = await provider.getTransaction(log.transactionHash);
                return {
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    value: ethers.formatEther(tx.value),
                    blockNumber: tx.blockNumber,
                    timestamp: (await provider.getBlock(tx.blockNumber)).timestamp
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
};

module.exports = {
    getNativeBalance,
    getTransactionHistory
};
