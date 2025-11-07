const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const balanceController = require('../controllers/balanceController');

// Contract routes
router.post('/deploy-token', contractController.deployToken);
router.get('/deployed-tokens', contractController.getDeployedTokensList);
router.get('/contract', contractController.getContractInfo);
router.get('/balance/:address', contractController.getTokenBalance);
router.get('/owner', contractController.getContractOwner);
router.post('/transfer-to-user', contractController.transferToUser);
router.post('/transfer', contractController.transferTokens);

// Balance and transaction routes
router.get('/native-balance/:address', balanceController.getNativeBalance);
router.get('/transactions/:address', balanceController.getTransactionHistory);

// Health check
router.get('/health', (req, res) => {
    const { getContractAddress } = require('../services/contractService');
    res.json({
        status: 'OK',
        contractDeployed: !!getContractAddress(),
        contractAddress: getContractAddress()
    });
});

module.exports = router;
