// scripts/deploy_certification.js
const { ethers, upgrades } = require('hardhat');

async function main () {
    const Class = await ethers.getContractFactory('CertificationRegistrationWithRole');
    const instance = Class.attach('0x3A691e00b89bd249c4c9f8865ff3A011344c568a');
    console.log(await instance.ISSUER_ROLE());
    const data = await instance.grantRole(await instance.ISSUER_ROLE(), '0x9B58483C919C9634BBBCeC5Ce36c0554Ff0017a1');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
