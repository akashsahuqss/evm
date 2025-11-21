const axios = require("axios");
const QRCode = require('qrcode');

class CoinGateService {
  constructor() {
    const isSandbox = process.env.NODE_ENV !== "production";

    this.baseUrl = isSandbox
      ? "https://api-sandbox.coingate.com/v2"
      : "https://api.coingate.com/v2";

    this.apiKey = process.env.COINGATE_API_KEY;

    if (!this.apiKey) {
      console.error("❌ Missing COINGATE_API_KEY in env");
    }
  }

  // ----------------------
  // CREATE ORDER (INVOICE)
  // ----------------------
  async createOrder(orderData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/orders`,
        {
          order_id: orderData.orderId,
          price_amount: orderData.amount,
          price_currency: orderData.currency,
          receive_currency: orderData.receiveCurrency || "BTC",
          title: orderData.title,
          description: orderData.description,
          callback_url: orderData.callbackUrl,
          cancel_url: orderData.cancelUrl,
          success_url: orderData.successUrl
        },
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const order = response.data;

      // Generate QR code for payment URL
      let qrCodeUrl = null;
      try {
        qrCodeUrl = await QRCode.toDataURL(order.payment_url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }

      return {
        id: order.id,
        status: order.status,
        payment_url: order.payment_url,
        pay_amount: order.pay_amount,
        pay_currency: order.pay_currency,
        receive_amount: order.receive_amount,
        receive_currency: order.receive_currency,
        qr_code_url: qrCodeUrl,
        created_at: order.created_at,
        order_id: order.order_id
      };
    } catch (error) {
      throw new Error(
        `CoinGate order creation failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // ----------------------
  // GET ORDER DETAILS
  // ----------------------
  async getOrder(orderId) {
    try {
      const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const order = response.data;

      // Generate QR code for payment URL
      let qrCodeUrl = null;
      try {
        qrCodeUrl = await QRCode.toDataURL(order.payment_url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }

      return {
        id: order.id,
        status: order.status,
        payment_url: order.payment_url,
        pay_amount: order.pay_amount,
        pay_currency: order.pay_currency,
        receive_amount: order.receive_amount,
        receive_currency: order.receive_currency,
        qr_code_url: qrCodeUrl,
        created_at: order.created_at,
        order_id: order.order_id
      };
    } catch (error) {
      throw new Error(
        `Failed to get CoinGate order: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // ----------------------
  // LIST AVAILABLE CURRENCIES
  // ----------------------
  async getCurrencies() {
    try {
      const response = await axios.get(`${this.baseUrl}/currencies`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data.map((currency) => ({
        id: currency.id,
        symbol: currency.symbol,
        title: currency.title,
        min_amount: currency.min_amount,
        is_crypto: currency.is_crypto,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get currencies: ${error.response?.data?.message || error.message}`
      );
    }
  }
}

module.exports = new CoinGateService();
