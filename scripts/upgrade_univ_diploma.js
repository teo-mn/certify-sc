// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('UniversityDiploma');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0xc014B6653c13a2cd112Df0Ecbf06E8c3dB882a79', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
