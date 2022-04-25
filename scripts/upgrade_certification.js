// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('CertificationRegistration');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0xE7655eB2B505FBDe44488E63a4E1D97Eea2e7f4B', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
