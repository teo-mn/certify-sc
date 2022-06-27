// scripts/upgrade_box.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('UniversityDiploma');
  console.log('Upgrading ...');
  await upgrades.upgradeProxy('0xd86718488ec33b444d0269ABD7A7462320A8213b', Class);
  console.log('Upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
