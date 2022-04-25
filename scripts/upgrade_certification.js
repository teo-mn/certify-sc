// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('CertificationRegistration');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0xCc546a88Db1aF7d250a2F20Dee42eC436F99e075', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
