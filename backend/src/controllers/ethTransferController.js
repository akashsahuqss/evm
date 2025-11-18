const ethTransferService = require('../services/ethTransferService');

class EthTransferController {
    async sendEther(req, res) {
        try {
            const { recipient, amount } = req.body;
            const network = req.query.network || 'localhost';

            if (!recipient || !amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Recipient address and amount are required'
                });
            }

            const amountNum = parseFloat(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be a positive number'
                });
            }

            const result = await ethTransferService.sendEther(recipient, amountNum, network);

            if (result.success) {
                res.json({
                    success: true,
                    transactionHash: result.transactionHash,
                    from: result.from,
                    to: result.to,
                    amount: result.amount
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('ETH transfer error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

module.exports = new EthTransferController();
