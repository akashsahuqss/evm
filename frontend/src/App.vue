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

      <div v-if="connected" class="wallet-features">
        <p><strong>Connected Wallet:</strong> {{ walletAddress }}</p>

        <!-- Network Selector -->
        <div class="feature-section">
          <h3>Select Network</h3>
          <div class="form-group">
            <label for="globalNetwork">Network:</label>
            <select id="globalNetwork" v-model="selectedNetwork" @change="switchNetwork">
              <option value="localhost">Ganache (Localhost)</option>
              <option value="sepolia">Sepolia</option>
              <option value="holesky">Holesky</option>
            </select>
          </div>
          <p><strong>Current Network:</strong> {{ this.selectedNetwork || 'Not Connected' }}</p>
        </div>

        <!-- Native Balance Section -->
        <div class="feature-section">
          <h3>Native Balance (ETH)</h3>
          <p v-if="nativeBalance !== null"><strong>Balance:</strong> {{ nativeBalance }} ETH</p>
          <button @click="fetchNativeBalance" :disabled="loading" class="action-btn">
            {{ loading ? 'Fetching...' : 'Fetch Balance' }}
          </button>
        </div>

        <!-- Transaction History Section -->
        <div class="feature-section">
          <h3>Transaction History ({{ selectedNetwork }})</h3>
          <button @click="fetchTransactions" :disabled="loading" class="action-btn">
            {{ loading ? 'Fetching...' : 'Fetch Transactions' }}
          </button>
          <div v-if="transactions.length > 0" class="transactions-list">
            <h4>Recent Transactions:</h4>
            <ul>
              <li v-for="tx in transactions" :key="tx.hash">
                <strong>Hash:</strong> {{ tx.hash }}<br>
                <strong>From:</strong> {{ tx.from }}<br>
                <strong>To:</strong> {{ tx.to }}<br>
                <strong>Value:</strong> {{ tx.value }} ETH<br>
                <strong>Block:</strong> {{ tx.blockNumber }}<br>
                <strong>Timestamp:</strong> {{ new Date(tx.timestamp * 1000).toLocaleString() }}
              </li>
            </ul>
          </div>
          <p v-else-if="transactionsFetched">No transactions found.</p>
        </div>

        <!-- Deploy Token Section -->
        <div class="feature-section">
          <h3>Deploy New ERC20 Token</h3>
          <div class="form-group">
            <label for="tokenName">Token Name:</label>
            <input
              id="tokenName"
              v-model="tokenName"
              type="text"
              placeholder="MyToken"
            >
          </div>
          <div class="form-group">
            <label for="tokenSymbol">Token Symbol:</label>
            <input
              id="tokenSymbol"
              v-model="tokenSymbol"
              type="text"
              placeholder="MTK"
            >
          </div>
          <div class="form-group">
            <label for="tokenSupply">Initial Supply:</label>
            <input
              id="tokenSupply"
              v-model="tokenSupply"
              type="number"
              placeholder="1000000"
            >
          </div>
          <button @click="deployToken" :disabled="loading" class="action-btn">
            {{ loading ? 'Deploying...' : 'Deploy Token' }}
          </button>
          <div v-if="deployedTokens.length > 0" class="deploy-result">
            <h4>Deployed Tokens:</h4>
            <ul>
              <li v-for="token in deployedTokens" :key="token.address">
                <strong>{{ token.name }} ({{ token.symbol }})</strong><br>
                <strong>Address:</strong> {{ token.address }}<br>
                <strong>Supply:</strong> {{ token.initialSupply }}
              </li>
            </ul>
          </div>

          <button @click="fetchDeployedTokens" :disabled="loading" class="action-btn">
            {{ loading ? 'Fetching...' : `List All Deployed Tokens on ${selectedNetwork}` }}
          </button>
        </div>

        <!-- Token Transfer Section -->
        <div class="feature-section">
          <h3>Transfer Tokens</h3>
          <p class="info-text">Transfer tokens from contract owner to a specified address.</p>
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

          <button @click="transferTokensToUser" :disabled="loading" class="transfer-btn">
            {{ loading ? 'Transferring...' : 'Transfer Tokens' }}
          </button>
        </div>

        <!-- Send ETH Section -->
        <div class="feature-section">
          <h3>Send ETH ({{ selectedNetwork === 'localhost' ? 'Ganache' : selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1) }})</h3>
          <p class="info-text">Send native Ethereum to another address on the {{ selectedNetwork === 'localhost' ? 'Ganache' : selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1) }} network.</p>
          <div class="form-group">
            <label for="ethRecipient">Recipient Address:</label>
            <input
              id="ethRecipient"
              v-model="ethRecipient"
              type="text"
              placeholder="0x..."
            >
          </div>
          <div class="form-group">
            <label for="ethAmount">Amount (ETH):</label>
            <input
              id="ethAmount"
              v-model="ethAmount"
              type="number"
              step="0.0001"
              placeholder="0.01"
            >
          </div>
          <button @click="sendEth" :disabled="loading" class="action-btn">
            {{ loading ? 'Sending...' : 'Send ETH' }}
          </button>
        </div>


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
      ethRecipient: '',
      ethAmount: '',
      loading: false,
      status: {
        message: '',
        type: 'info'
      },
      transferStatus: {
        message: '',
        type: 'info'
      },
      contract: null,
      signer: null,
      currentNetwork: '',
      nativeBalance: null,
      selectedNetwork: 'localhost',
      transactions: [],
      transactionsFetched: false,
      tokenName: '',
      tokenSymbol: '',
      tokenSupply: '',
      deployedTokens: []
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
          // Map chain ID to readable network name
          const networkNames = {
            1337: 'localhost',
            11155111: 'sepolia',
            17000: 'holesky'
          }
          this.currentNetwork = networkNames[chainId] || network.name
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

          // Fetch deployed tokens list
          await this.fetchDeployedTokens()

          this.showStatus(`Connected to MetaMask: ${this.walletAddress}`, 'success')
        } catch (error) {
          this.showStatus(`Error connecting to MetaMask: ${error.message}`, 'error')
        }
      } else {
        this.showStatus('MetaMask not detected. Please install MetaMask.', 'error')
      }
    },

    async fetchNativeBalance() {
      this.loading = true
      try {
        const response = await fetch(`http://localhost:3005/api/native-balance/${this.walletAddress}?network=${this.selectedNetwork}`)
        const data = await response.json()
        if (response.ok) {
          this.nativeBalance = data.balance
          this.showStatus('Native balance fetched successfully!', 'success')
        } else {
          this.showStatus(`Failed to fetch balance: ${data.error}`, 'error')
        }
      } catch (error) {
        this.showStatus(`Error fetching balance: ${error.message}`, 'error')
      } finally {
        this.loading = false
      }
    },

    async fetchTransactions() {
      this.loading = true
      try {
        const response = await fetch(`http://localhost:3005/api/transactions/${this.walletAddress}?network=${this.selectedNetwork}`)
        const data = await response.json()
        if (response.ok) {
          this.transactions = data.transactions
          this.transactionsFetched = true
          this.showStatus('Transaction history fetched successfully!', 'success')
        } else {
          this.showStatus(`Failed to fetch transactions: ${data.error}`, 'error')
        }
      } catch (error) {
        this.showStatus(`Error fetching transactions: ${error.message}`, 'error')
      } finally {
        this.loading = false
      }
    },

    async deployToken() {
      if (!this.tokenName || !this.tokenSymbol || !this.tokenSupply) {
        this.showStatus('Please fill in all token details.', 'error')
        return
      }

      if (parseFloat(this.tokenSupply) <= 0) {
        this.showStatus('Initial supply must be positive.', 'error')
        return
      }

      this.loading = true

      try {
        this.showStatus(`Deploying ${this.tokenName} token on ${this.selectedNetwork}...`, 'info')

        const response = await fetch(`http://localhost:3005/api/deploy-token?network=${this.selectedNetwork}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: this.tokenName,
            symbol: this.tokenSymbol,
            initialSupply: this.tokenSupply
          })
        })

        const data = await response.json()
        if (response.ok) {
          // Check if token already exists
          const existingToken = this.deployedTokens.find(token => token.name === data.name && token.symbol === data.symbol)
          if (existingToken) {
            this.showStatus('Token with this name and symbol already exists!', 'info')
            return
          }

          this.deployedTokens.push(data)
          this.showStatus('Token deployed successfully!', 'success')
          // Add token to MetaMask
          await this.addTokenToMetaMask(data)
        } else {
          this.showStatus(`Failed to deploy token: ${data.error}`, 'error')
        }
      } catch (error) {
        this.showStatus(`Error deploying token: ${error.message}`, 'error')
      } finally {
        this.loading = false
      }
    },

    async addTokenToMetaMask(tokenData) {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: tokenData.address,
                symbol: tokenData.symbol,
                decimals: 18,
                image: '' // Optional: Add token logo URL if available
              }
            }
          })
          this.showStatus('Token added to MetaMask!', 'success')
        } catch (error) {
          this.showStatus('Token deployed but not added to MetaMask.', 'info')
        }
      }
    },

    async transferTokensToUser() {
      if (parseFloat(this.amount) <= 0) {
        this.showStatus('Amount must be positive.', 'error')
        return
      }

      this.loading = true

      try {
        this.showStatus(`Getting ${this.amount} tokens on ${this.selectedNetwork}...`, 'info')

        const response = await fetch(`http://localhost:3005/api/transfer-to-user?network=${this.selectedNetwork}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipientAddress: this.recipient,
            amount: this.amount
          })
        })

        const data = await response.json()
        if (response.ok) {
          this.showStatus(`Tokens transferred successfully! Tx: ${data.txHash}`, 'success')
        } else {
          this.showStatus(`Failed to transfer tokens: ${data.error}`, 'error')
        }
      } catch (error) {
        this.showStatus(`Error transferring tokens: ${error.message}`, 'error')
      } finally {
        this.loading = false
      }
    },

    async fetchDeployedTokens() {
      this.loading = true
      try {
        const response = await fetch(`http://localhost:3005/api/deployed-tokens?network=${this.selectedNetwork}`)
        const data = await response.json()
        if (response.ok) {
          this.deployedTokens = data.tokens
          this.showStatus('Deployed tokens fetched successfully!', 'success')
        } else {
          this.showStatus(`Failed to fetch tokens: ${data.error}`, 'error')
        }
      } catch (error) {
        this.showStatus(`Error fetching tokens: ${error.message}`, 'error')
      } finally {
        this.loading = false
      }
    },



    async sendEth() {
      if (!this.ethRecipient || !this.ethAmount) {
        this.showStatus('Please enter recipient address and amount.', 'error')
        return
      }

      const amountNum = parseFloat(this.ethAmount)
      if (isNaN(amountNum) || amountNum <= 0) {
        this.showStatus('Amount must be a positive number.', 'error')
        return
      }

      this.loading = true

      try {
        this.showStatus('Sending ETH...', 'info')

        const response = await fetch(`http://localhost:3005/api/eth-transfer/send?network=${this.selectedNetwork}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipient: this.ethRecipient,
            amount: this.ethAmount
          })
        })

        const data = await response.json()
        if (response.ok && data.success) {
          this.showStatus(`ETH sent successfully! Tx: ${data.transactionHash}`, 'success')
        } else {
          this.showStatus(`Failed to send ETH: ${data.error}`, 'error')
        }
      } catch (error) {
        this.showStatus(`Error sending ETH: ${error.message}`, 'error')
      } finally {
        this.loading = false
      }
    },

    async switchNetwork() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          let chainId
          if (this.selectedNetwork === 'localhost') {
            chainId = '0x539' // Ganache default
          } else if (this.selectedNetwork === 'sepolia') {
            chainId = '0xaa36a7' // Sepolia
          } else if (this.selectedNetwork === 'holesky') {
            chainId = '0x4268' // Holesky
          }

          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
          })

          // Reload contract for new network
          await this.loadContract()

          // Automatically fetch balance for the new network
          await this.fetchNativeBalance()

          this.showStatus(`Switched to ${this.selectedNetwork} network`, 'success')
        } catch (error) {
          this.showStatus(`Error switching network: ${error.message}`, 'error')
        }
      } else {
        this.showStatus('MetaMask not detected.', 'error')
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

.wallet-features {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
}

.feature-section {
  margin-bottom: 30px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.feature-section h3 {
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
}

.action-btn {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: #17a2b8;
  color: white;
}

.action-btn:hover:not(:disabled) {
  background-color: #138496;
}

.action-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.transactions-list {
  margin-top: 15px;
}

.transactions-list ul {
  list-style: none;
  padding: 0;
}

.transactions-list li {
  background-color: #f8f9fa;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  border-left: 4px solid #007bff;
}

.deploy-result {
  margin-top: 15px;
  padding: 15px;
  background-color: #d4edda;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
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

.qr-code {
  display: flex;
  justify-content: center;
  margin: 15px 0;
}

.nowpayments-widget {
  display: flex;
  justify-content: center;
  margin: 15px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}
</style>
