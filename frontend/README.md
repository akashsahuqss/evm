# Frontend Vue.js Application

This is the frontend application for the Token Transfer project, built with Vue.js 2.

## Features

- MetaMask wallet connection
- ERC20 token deployment
- Token transfer functionality
- Transaction history viewing
- Native balance checking
- NowPayments crypto payment integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run serve
```

The application will be available at `http://localhost:8080` (or the next available port).

## Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── App.vue          # Main application component
├── main.js          # Vue application entry point
└── components/      # Reusable components (if any)

public/
└── index.html       # HTML template
```

## Dependencies

- Vue.js 2.6.14
- Ethers.js 5.7.2
- Core-js 3.8.3

## Development

The application communicates with the backend API server running on `http://localhost:3005`.

Make sure the backend server is running before starting the frontend development server.
