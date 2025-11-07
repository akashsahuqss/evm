const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Import routes
const paymentRoutes = require('./src/routes/paymentRoutes');
const contractRoutes = require('./src/routes/contractRoutes');

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
app.use('/api/nowpayments', paymentRoutes);

// Serve static files (for the HTML UI and Vue frontend)
app.use(express.static('.'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
