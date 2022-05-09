// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('IssuerRegistration');
  await upgrades.upgradeProxy('0x9dca2a5a5412C32930d6CAf8DC1e6c7C2DCd3483', Class);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
