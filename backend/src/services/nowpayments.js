const axios = require('axios');

class NowPaymentsService {
  constructor() {
    this.apiKey = process.env.NOWPAYMENTS_API_KEY;
    this.baseUrl = 'https://api.nowpayments.io/v1';
  }

  async createPayment(amount, currency) {
    try {
      const response = await axios.post(`${this.baseUrl}/invoice`, {
        price_amount: amount,
        price_currency: 'usd', // Assuming amount is in USD, adjust if needed
        pay_currency: currency,
        ipn_callback_url: `${process.env.BASE_URL || 'http://localhost:3005'}/api/nowpayments/ipn`,
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/cancel`
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        paymentId: response.data.id,
        paymentUrl: response.data.invoice_url,
        payAddress: response.data.pay_address,
        payAmount: response.data.pay_amount,
        payCurrency: response.data.pay_currency
      };
    } catch (error) {
      console.error('NowPayments API error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await axios.get(`${this.baseUrl}/payment/${paymentId}`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return {
        success: true,
        status: response.data.payment_status,
        data: response.data
      };
    } catch (error) {
      console.error('NowPayments status check error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new NowPaymentsService();
