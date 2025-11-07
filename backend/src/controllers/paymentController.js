const nowPaymentsService = require('../services/nowpayments');

class PaymentController {
  async createPayment(req, res) {
    try {
      const { amount, currency } = req.body;

      if (!amount || !currency) {
        return res.status(400).json({
          success: false,
          error: 'Amount and currency are required'
        });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be positive'
        });
      }

      const validCurrencies = ['btc', 'eth', 'usdt', 'usdc'];
      if (!validCurrencies.includes(currency.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid currency. Supported: BTC, ETH, USDT, USDC'
        });
      }

      const result = await nowPaymentsService.createPayment(amount, currency);

      if (result.success) {
        res.json({
          success: true,
          paymentId: result.paymentId,
          paymentUrl: result.paymentUrl,
          payAddress: result.payAddress,
          payAmount: result.payAmount,
          payCurrency: result.payCurrency
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          error: 'Payment ID is required'
        });
      }

      const result = await nowPaymentsService.getPaymentStatus(paymentId);

      if (result.success) {
        res.json({
          success: true,
          status: result.status,
          data: result.data
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async handleIPN(req, res) {
    try {
      // Handle Instant Payment Notification from NowPayments
      const paymentData = req.body;

      console.log('IPN received:', paymentData);

      // Here you would typically:
      // 1. Verify the IPN signature
      // 2. Update payment status in database
      // 3. Trigger any business logic (send emails, update user balance, etc.)

      res.json({ success: true });
    } catch (error) {
      console.error('IPN handling error:', error);
      res.status(500).json({
        success: false,
        error: 'IPN processing failed'
      });
    }
  }
}

module.exports = new PaymentController();
