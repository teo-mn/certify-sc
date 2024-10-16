// scripts/deploy_certification.js
const {ethers, upgrades} = require('hardhat');

async function main() {
    const Class = await ethers.getContractFactory('UniversityDiploma');
    const instance = Class.attach('0xc0668aC1BE4393F9dA6c8eB81a24faA4F9B04Edb');
    const data = await instance.setApprover('0xfe5B2A3979de6eCeD8C439681eDD5060637610Ce');
    console.log(data);
    console.log('Approver added');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
