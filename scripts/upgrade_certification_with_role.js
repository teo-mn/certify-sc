// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('CertificationRegistrationWithRole');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0x07b47Ed5a0644Ad01B24c8a20E705c5818acB646', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
