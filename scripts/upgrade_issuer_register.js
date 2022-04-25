// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('IssuerRegistration');
  await upgrades.upgradeProxy('0xC602a0E0682f1A32B539a6f639506a2B9414A22e', Class);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
