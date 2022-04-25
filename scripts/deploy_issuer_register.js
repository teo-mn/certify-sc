// scripts/deploy_issuer_register.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('IssuerRegistration');
  console.log('Deploying Issuer registration...');
  const instance = await upgrades.deployProxy(Class);
  await instance.deployed();
  console.log('Issuer registration deployed to:', instance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
