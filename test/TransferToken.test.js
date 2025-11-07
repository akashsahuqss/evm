const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransferToken", function () {
  it("Should transfer tokens between accounts", async function () {
    const [owner, addr1] = await ethers.getSigners();
    console.log("Owner address:", owner.address);
    console.log("Addr1 address:", addr1.address);

    const TransferToken = await ethers.getContractFactory("TransferToken");
    console.log("Deploying TransferToken...", TransferToken);

    const token = await TransferToken.deploy(1000000);
    console.log("Deployment transaction:", token.deploymentTransaction());

    await token.waitForDeployment();

    // Transfer 50 tokens from owner to addr1
    await token.transfer(addr1.address, 50);
    expect(await token.balanceOf(addr1.address)).to.equal(50);
  });
});
