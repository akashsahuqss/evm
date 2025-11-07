const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Create a new payment
router.post('/create-payment', paymentController.createPayment);

// Get payment status
router.get('/status/:paymentId', paymentController.getPaymentStatus);

// Handle IPN (Instant Payment Notification) from NowPayments
router.post('/ipn', paymentController.handleIPN);

module.exports = router;
