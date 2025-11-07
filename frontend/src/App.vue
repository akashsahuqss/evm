<template>
  <div id="app">
    <div class="container">
      <h1>MetaMask Token Transfer</h1>

      <div v-if="status.message" :class="['status', status.type]">
        {{ status.message }}
      </div>

      <button v-if="!connected" @click="connectMetaMask" class="connect-btn">
        Connect MetaMask
      </button>

      <div v-if="connected" class="transfer-form">
        <p><strong>Connected Wallet:</strong> {{ walletAddress }}</p>

        <div class="form-group">
          <label for="recipient">Recipient Address:</label>
          <input
            id="recipient"
            v-model="recipient"
            type="text"
            placeholder="0x..."
          >
        </div>

        <div class="form-group">
          <label for="amount">Amount (Tokens):</label>
          <input
            id="amount"
            v-model="amount"
            type="number"
            step="0.0001"
            placeholder="0.01"
          >
        </div>

        <button @click="transferTokens" :disabled="loading" class="transfer-btn">
          {{ loading ? 'Transferring...' : 'Transfer Tokens' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ethers } from 'ethers'

export default {
  name: 'App',
  data() {
    return {
      connected: false,
      walletAddress: '',
      recipient: '0xc32CFEe0e3fd43a1dbE5001EB50c1413293a5D34',
      amount: '0.01',
      loading: false,
      status: {
        message: '',
        type: 'info'
      },
      contract: null,
      signer: null,
      currentNetwork: ''
    }
  },

  methods: {
    showStatus(message, type = 'info') {
      this.status = { message, type }
      setTimeout(() => {
        this.status.message = ''
      }, 5000)
    },

    async loadContract() {
      try {
        // Get current network
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const network = await provider.getNetwork()
        const chainId = network.chainId

        // Request contract for current network
        const response = await fetch(`http://localhost:3005/api/contract?network=${chainId}`)
        const data = await response.json()
        if (response.ok) {
          this.contract = new ethers.Contract(data.address, data.abi, provider.getSigner())
          this.currentNetwork = network.name
          return true
        } else {
          this.showStatus(`Failed to load contract: ${data.error}`, 'error')
          return false
        }
      } catch (error) {
        this.showStatus(`Error loading contract: ${error.message}`, 'error')
        return false
      }
    },

    async connectMetaMask() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          await provider.send("eth_requestAccounts", [])
          this.signer = provider.getSigner()
          this.walletAddress = await this.signer.getAddress()
          this.connected = true

          // Load contract after connecting
          const contractLoaded = await this.loadContract()
          if (!contractLoaded) {
            this.showStatus('Warning: Contract not loaded, but you can still connect to MetaMask.', 'info')
          }

          this.showStatus(`Connected to MetaMask: ${this.walletAddress}`, 'success')
        } catch (error) {
          this.showStatus(`Error connecting to MetaMask: ${error.message}`, 'error')
        }
      } else {
        this.showStatus('MetaMask not detected. Please install MetaMask.', 'error')
      }
    },

    async transferTokens() {
      if (!this.contract) {
        // Try to load contract again
        this.showStatus('Loading contract...', 'info')
        const contractLoaded = await this.loadContract()
        if (!contractLoaded) {
          this.showStatus('Contract not available. Please check your network connection.', 'error')
          return
        }
      }

      if (!ethers.utils.isAddress(this.recipient)) {
        this.showStatus('Invalid recipient address.', 'error')
        return
      }

      if (parseFloat(this.amount) <= 0) {
        this.showStatus('Amount must be positive.', 'error')
        return
      }

      this.loading = true

      try {
        this.showStatus(`Transferring ${this.amount} tokens to ${this.recipient}...`, 'info')

        // Call the secureTransfer function on the contract
        const tx = await this.contract.secureTransfer(
          this.recipient,
          ethers.utils.parseEther(this.amount)
        )

        this.showStatus(`Transaction sent! Hash: ${tx.hash}`, 'success')
        console.log("Transaction hash:", tx.hash)

        await tx.wait()
        this.showStatus('Token transfer successful!', 'success')
      } catch (error) {
        this.showStatus(`Token transfer failed: ${error.message}`, 'error')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.container {
  max-width: 600px;
  width: 100%;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.status {
  margin: 10px 0;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
}

.success { background-color: #d4edda; color: #155724; }
.error { background-color: #f8d7da; color: #721c24; }
.info { background-color: #d1ecf1; color: #0c5460; }

.connect-btn, .transfer-btn {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.connect-btn {
  background-color: #007bff;
  color: white;
}

.connect-btn:hover {
  background-color: #0056b3;
}

.transfer-btn {
  background-color: #28a745;
  color: white;
}

.transfer-btn:hover:not(:disabled) {
  background-color: #218838;
}

.transfer-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.transfer-form {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
}

.form-group {
  margin: 15px 0;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
}
</style>
