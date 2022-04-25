// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('IssuerRegistration');
  await upgrades.upgradeProxy('0xB1aA1eBe8EA8B2Aa490436362C2D6ceEf1aA8263', Class);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
