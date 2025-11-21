const express = require('express');
const router = express.Router();
const coingateController = require('../controllers/coingateController');

// Create a new CoinGate order
router.post('/order', coingateController.createOrder);

// Get order details
router.get('/order/:id', coingateController.getOrder);

// Get available currencies
router.get('/currencies', coingateController.getCurrencies);

// Webhook endpoint for CoinGate notifications
router.post('/webhook', coingateController.handleWebhook);

module.exports = router;
