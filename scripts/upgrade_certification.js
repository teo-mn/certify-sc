// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('CertificationRegistration');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0x5d305D8423c0f07bEaf15ba6a5264e0c88fC41B4', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
