const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Import routes
const contractRoutes = require('./src/routes/contractRoutes');
const ethTransferRoutes = require('./src/routes/ethTransferRoutes');
const coingateRoutes = require('./src/routes/coingateRoutes');

// Import services
const { initializeHardhat } = require('./src/services/contractService');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Hardhat on server start
initializeHardhat().then((result) => {
    if (result) {
        console.log('Hardhat initialized successfully');
    } else {
        console.log('Failed to initialize Hardhat');
    }
});

// API Routes
app.use('/api', contractRoutes);
app.use('/api/eth-transfer', ethTransferRoutes);
app.use('/api/coingate', coingateRoutes);

// Serve static files (for the HTML UI and Vue frontend)
app.use(express.static('.'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
