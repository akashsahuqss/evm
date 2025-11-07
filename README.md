# Token Transfer Application

A full-stack Ethereum application for token transfers with MetaMask integration and NowPayments crypto payment processing.

## Project Structure

```
├── backend/              # Express.js API server
│   ├── server.js        # Main server file
│   ├── package.json     # Backend dependencies
│   ├── README.md        # Backend documentation
│   └── .env.example     # Environment variables template
├── frontend/             # Vue.js frontend application
│   ├── src/
│   │   ├── App.vue      # Main Vue component
│   │   └── main.js      # Vue app entry point
│   ├── public/
│   ├── package.json     # Frontend dependencies
│   └── README.md        # Frontend documentation
├── contracts/            # Solidity smart contracts
│   └── TransferToken.sol # ERC20 token contract
├── test/                 # Hardhat tests
├── hardhat.config.js     # Hardhat configuration
└── package.json          # Root package.json for Hardhat
```

## Features

- **MetaMask Integration**: Connect wallet and manage Ethereum accounts
- **Token Deployment**: Deploy custom ERC20 tokens
- **Token Transfers**: Secure token transfer functionality
- **Transaction History**: View transaction history across networks
- **Balance Checking**: Check native ETH and token balances
- **NowPayments Integration**: Process crypto payments with customizable amounts and currencies
- **Multi-Network Support**: Support for localhost, Sepolia, and Holesky testnets

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask browser extension
- Hardhat (for contract development)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd token-transfer-app
```

2. **Install root dependencies (for Hardhat):**
```bash
npm install
```

3. **Setup backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Setup frontend:**
```bash
cd ../frontend
npm install
```

### Configuration

1. **Backend Environment Variables** (`.env`):
```
PORT=3005
ETHERSCAN_API_KEY=your_etherscan_api_key
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
HOLESKY_RPC_URL=https://holesky.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key
```

2. **Get API Keys:**
   - [Etherscan API Key](https://etherscan.io/apis)
   - [NowPayments API Key](https://nowpayments.io/)
   - [Infura Project ID](https://infura.io/)

### Running the Application

1. **Start Hardhat node (optional, for local development):**
```bash
npm run serve
```

2. **Start backend server:**
```bash
cd backend
npm start
```

3. **Start frontend development server:**
```bash
cd frontend
npm run serve
```

4. **Access the application:**
   - Frontend: `http://localhost:8080`
   - Backend API: `http://localhost:3005`

## Development

### Testing Contracts

```bash
npx hardhat test
```

### Deploying Contracts

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## API Documentation

See `backend/README.md` for detailed API endpoint documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
