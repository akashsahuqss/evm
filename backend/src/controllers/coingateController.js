const coingateService = require('../services/coingateService');

const createOrder = async (req, res) => {
  console.log('Create Order Request Body:', req.body);
  try {
    const { amount, currency, receiveCurrency, title, description, callbackUrl, cancelUrl, successUrl } = req.body;

    const orderData = {
      orderId: `order_${Date.now()}`,
      amount,
      currency,
      receiveCurrency,
      title,
      description,
      callbackUrl,
      cancelUrl,
      successUrl
    };

    const order = await coingateService.createOrder(orderData);

    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        payment_url: order.payment_url,
        receive_amount: order.receive_amount,
        receive_currency: order.receive_currency,
        qr_code_url: order.qr_code_url,
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await coingateService.getOrder(id);

    // Calculate conversion rate
    const conversionRate = order.receive_amount && order.pay_amount ?
      parseFloat(order.receive_amount) / parseFloat(order.pay_amount) : null;

    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        payment_url: order.payment_url,
        price_amount: order.pay_amount,
        price_currency: order.pay_currency,
        receive_amount: order.receive_amount,
        qr_code_url: order.qr_code_url,
        receive_currency: order.receive_currency,
        conversion_rate: conversionRate,
        usd_to_crypto: `${order.pay_amount} ${order.pay_currency} = ${order.receive_amount} ${order.receive_currency}`,
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCurrencies = async (req, res) => {
  try {
    const currencies = await coingateService.getCurrencies();
    res.json({ success: true, currencies });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const { id, status } = req.body;

    // Process webhook data (e.g., update order status in database)
    console.log(`Webhook received for order ${id}: ${status}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getCurrencies,
  handleWebhook
};
