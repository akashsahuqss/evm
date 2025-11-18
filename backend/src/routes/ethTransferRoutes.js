const express = require('express');
const router = express.Router();
const ethTransferController = require('../controllers/ethTransferController');

// POST /api/eth-transfer/send
router.post('/send', ethTransferController.sendEther);

module.exports = router;
