// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('UniversityDiploma');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0xD882B76106d0Ba1a54DE30d620dC5c2892Ae1677', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
