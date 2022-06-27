// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('IssuerRegistration');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0x824B721ceaf50e66281c905F0e79F3EE45D52613', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
