// scripts/deploy_certification.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('CertificationRegistration');
  console.log('Deploying certification...');
  const instance = await upgrades.deployProxy(Class);
  await instance.deployed();
  console.log('Certification deployed to:', instance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
