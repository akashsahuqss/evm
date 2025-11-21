<template>
  <div class="coingate-payment">
    <h3>CoinGate Crypto Payment</h3>
    <p class="info-text">Pay with cryptocurrency using CoinGate</p>

    <div v-if="!orderCreated" class="payment-form">
      <div class="form-group">
        <label for="amount">Amount (USD):</label>
        <input
          id="amount"
          v-model="amount"
          type="number"
          step="0.01"
          placeholder="10.00"
        >
      </div>

      <!-- <div class="form-group">
        <label for="currency">Pay with:</label>
        <select id="currency" v-model="selectedCurrency">
          <option value="">Select cryptocurrency</option>
          <option v-for="currency in availableCurrencies" :key="currency.id" :value="currency.symbol">
            {{ currency.title }} ({{ currency.symbol }})
          </option>
        </select>
      </div> -->

      <button @click="createOrder" :disabled="loading || !amount" class="create-order-btn">
        {{ loading ? 'Creating Order...' : 'Create Payment Order' }}
      </button>
    </div>

    <div v-else class="order-details">
      <div class="order-info">
        <h4>Payment Order Created</h4>
        <p><strong>Order ID:</strong> {{ order.id }}</p>
        <p><strong>Pay Amount:</strong> {{ amount }} USD</p>
        <!-- <p><strong>Pay Amount:</strong> {{ order.price_amount }} {{ order.price_currency }}</p> -->
        <!-- <p><strong>Receive:</strong> {{ order.receive_amount }} {{ order.receive_currency }}</p> -->
        <!-- <p><strong>Status:</strong> <span :class="getStatusClass(order.status)">{{ order.status }}</span></p> -->
      </div>

      <div class="payment-actions">
        <button @click="openPaymentUrl" class="pay-btn">
          Pay Now
        </button>
        <!-- <button @click="checkStatus" :disabled="loading" class="check-status-btn">
          {{ loading ? 'Checking...' : 'Check Status' }}
        </button> -->
        <button @click="resetOrder" class="reset-btn">
          New Payment
        </button>
      </div>

      <div v-if="order.payment_url" class="payment-url">
        <p><strong>Payment URL:</strong></p>
        <a :href="order.payment_url" target="_blank" rel="noopener noreferrer">{{ order.payment_url }}</a>
      </div>

      <div v-if="order.qr_code_url" class="qr-code">
        <p>Scan QR Code to Pay</p><br/>
      </div>
      <div v-if="order.qr_code_url" class="qr-code">
        <img :src="order.qr_code_url" alt="QR Code for Payment">
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'CoinGatePayment',
  data() {
    return {
      amount: '',
      selectedCurrency: '',
      availableCurrencies: [],
      order: null,
      orderCreated: false,
      qrCodeUrl: '',
      loading: false,
      error: null
    }
  },

  mounted() {
    this.fetchCurrencies();
  },

  methods: {
    async fetchCurrencies() {
      try {
        const response = await fetch('http://localhost:3005/api/coingate/currencies');
        const data = await response.json();
        if (data.success) {
          this.availableCurrencies = data.currencies;
        }
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
        this.error = 'Failed to load available currencies';
      }
    },

    async createOrder() {
      if (!this.amount) {
        this.error = 'Please enter amount and select currency';
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await fetch('http://localhost:3005/api/coingate/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: this.amount,
            currency: 'USD',
            receiveCurrency: this.selectedCurrency,
            title: 'Crypto Payment',
            description: 'Payment via CoinGate'
          })
        });

        const data = await response.json();

        if (data.success) {
          this.order = data.order;
          this.orderCreated = true;
        } else {
          this.error = data.error || 'Failed to create order';
        }
      } catch (error) {
        console.error('Order creation error:', error);
        this.error = 'Failed to create payment order';
      } finally {
        this.loading = false;
      }
    },

    async checkStatus() {
      if (!this.order) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`http://localhost:3005/api/coingate/order/${this.order.id}`);
        const data = await response.json();

        if (data.success) {
          this.order = data.order;
        } else {
          this.error = data.error || 'Failed to check order status';
        }
      } catch (error) {
        console.error('Status check error:', error);
        this.error = 'Failed to check payment status';
      } finally {
        this.loading = false;
      }
    },

    openPaymentUrl() {
      if (this.order && this.order.payment_url) {
        window.open(this.order.payment_url, '_blank');
      }
    },

    resetOrder() {
      this.order = null;
      this.orderCreated = false;
      this.amount = '';
      this.selectedCurrency = '';
      this.error = null;
    },

    getStatusClass(status) {
      const statusClasses = {
        'new': 'status-new',
        'pending': 'status-pending',
        'confirming': 'status-confirming',
        'paid': 'status-paid',
        'invalid': 'status-invalid',
        'expired': 'status-expired',
        'canceled': 'status-canceled',
        'refunded': 'status-refunded'
      };
      return statusClasses[status] || 'status-unknown';
    }
  }
}
</script>

<style scoped>
.coingate-payment {
  margin-bottom: 30px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.coingate-payment h3 {
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #28a745;
  padding-bottom: 5px;
}

.info-text {
  color: #666;
  margin-bottom: 15px;
}

.form-group {
  margin: 15px 0;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
}

.create-order-btn, .pay-btn, .check-status-btn, .reset-btn {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.create-order-btn {
  background-color: #28a745;
  color: white;
}

.create-order-btn:hover:not(:disabled) {
  background-color: #218838;
}

.create-order-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pay-btn {
  background-color: #007bff;
  color: white;
}

.pay-btn:hover {
  background-color: #0056b3;
}

.check-status-btn {
  background-color: #17a2b8;
  color: white;
}

.check-status-btn:hover:not(:disabled) {
  background-color: #138496;
}

.check-status-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #6c757d;
  color: white;
}

.reset-btn:hover {
  background-color: #545b62;
}

.order-details {
  margin-top: 20px;
}

.order-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.order-info h4 {
  margin-bottom: 10px;
  color: #333;
}

.order-info p {
  margin: 5px 0;
}

.payment-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.payment-actions button {
  flex: 1;
}

.payment-url {
  background-color: #e9ecef;
  padding: 10px;
  border-radius: 5px;
}

.payment-url a {
  color: #007bff;
  word-break: break-all;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin-top: 15px;
}

/* Status classes */
.status-new { color: #007bff; }
.status-pending { color: #ffc107; }
.status-confirming { color: #17a2b8; }
.status-paid { color: #28a745; }
.status-invalid { color: #dc3545; }
.status-expired { color: #6c757d; }
.status-canceled { color: #dc3545; }
.status-refunded { color: #17a2b8; }
.status-unknown { color: #6c757d; }
</style>
