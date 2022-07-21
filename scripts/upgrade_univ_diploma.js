// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('UniversityDiploma');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0xc0668aC1BE4393F9dA6c8eB81a24faA4F9B04Edb', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
