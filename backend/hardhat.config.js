require('dotenv').config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

const config = {
  solidity: "0.8.28",
  paths: {
    sources: "../contracts",
    artifacts: "../artifacts",
    cache: "../cache"
  },
  networks: {}
};

if (process.env.SEPOLIA_RPC_URL && process.env.PRIVATE_KEY) {
  config.networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  };
}

if (process.env.HOLESKY_RPC_URL && process.env.PRIVATE_KEY) {
  config.networks.holesky = {
    url: process.env.HOLESKY_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  };
}

module.exports = config;
