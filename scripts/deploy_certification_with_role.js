// scripts/deploy_certification.js
const { ethers, upgrades } = require('hardhat');

async function main () {
  const Class = await ethers.getContractFactory('CertificationRegistrationWithRole');
  console.log('Deploying certification with role...');
  const instance = await upgrades.deployProxy(Class, ['0xfea819f5FD7782701e0229748D44159C2a267898', '0x824B721ceaf50e66281c905F0e79F3EE45D52613']);
  await instance.deployed();
  console.log('CertificationWithRole deployed to:', instance.address);
  console.log('Кредит контракт дээр энэ контрактын хаягийг burn хийх эрхтэй болгож нэмээрэй.');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
