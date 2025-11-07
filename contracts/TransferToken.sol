// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TransferToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("TransferToken", "TTK") Ownable(msg.sender) {
        require(initialSupply > 0, "Initial supply must be positive");
        _mint(msg.sender, initialSupply);
    }

    // Secure transfer with checks-effects-interactions pattern
    function secureTransfer(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be positive");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Effects: Update balances
        _transfer(msg.sender, recipient, amount);

        // Interactions: Emit event (handled by _transfer)
    }

    // View function to check balance
    function getBalance(address account) external view returns (uint256) {
        return balanceOf(account);
    }
}
