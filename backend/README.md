# Backend API Server

This is the backend server for the Token Transfer application, built with Express.js and Hardhat.

## Features

- ERC20 token deployment and management
- Native balance checking
- Transaction history retrieval
- NowPayments integration for crypto payments
- MetaMask wallet integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
PORT=3005
ETHERSCAN_API_KEY=your_etherscan_api_key
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
HOLESKY_RPC_URL=your_holesky_rpc_url
PRIVATE_KEY=your_private_key
```

3. Start the server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Contract Management
- `GET /api/contract?network=<network>` - Get contract information
- `POST /api/deploy-token` - Deploy a new ERC20 token

### Balance & Transactions
- `GET /api/native-balance/:address` - Get native ETH balance
- `GET /api/balance/:address` - Get token balance
- `GET /api/transactions/:address?network=<network>` - Get transaction history

### Payments
- `POST /api/nowpayments/create-payment` - Create a NowPayments invoice

### Token Operations
- `POST /api/transfer` - Transfer tokens (requires signed transaction)

## Environment Variables

- `PORT`: Server port (default: 3005)
- `ETHERSCAN_API_KEY`: API key for Etherscan
- `NOWPAYMENTS_API_KEY`: API key for NowPayments
- `SEPOLIA_RPC_URL`: RPC URL for Sepolia testnet
- `HOLESKY_RPC_URL`: RPC URL for Holesky testnet
- `PRIVATE_KEY`: Private key for contract deployment
