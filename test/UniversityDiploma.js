// noinspection DuplicatedCode

const {ethers, upgrades} = require('hardhat');
const {expect} = require('chai');
const {address} = require("hardhat/internal/core/config/config-validation");
describe("University Diploma Contract", function () {
    async function deploy() {
        const [owner, otherAccount, approver] = await ethers.getSigners();
        const Class = await ethers.getContractFactory('UniversityDiploma');
        console.log('Deploying UniversityDiploma...');
        const instance = await upgrades.deployProxy(Class);
        await instance.deployed();
        const ClassCredit = await ethers.getContractFactory('Credits');
        console.log('Deploying credits...');
        const credit = await upgrades.deployProxy(ClassCredit);
        await credit.deployed();
        await instance.setCreditAddress(credit.address)
        await instance.setApproverAddress(approver.address)
        await credit.allowBurnToAddress(instance.address)

        return {instance, owner, otherAccount, credit, approver};
    }

    describe("Deployment", function () {
        it("Owner should be matched", async function () {
            const {instance, owner} = await deploy();
            expect(await instance.owner()).to.equal(owner.address);
        })
    })
    describe("Issue simple", function () {
        it("Should be reverted with not enough credit error", async function () {
            const {instance, owner} = await deploy();
            await expect(instance.addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).to.be.reverted
        })
        it("Should be issued without error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            const cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal("imageHash")
            expect(cert[4]).to.equal("metaHash")
            expect(cert[5]).to.equal(otherAccount.address)
            expect(cert[6]).to.equal(0)
            expect(cert[8]).to.equal("")
        })
        it("Should be reverted with already issued error hash", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash2", "metaHash2", "certNum2", 0, "")).to.be.reverted
        })
        it("Should be reverted with already issued error certnum", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).addCertification("hash2", "imageHash3", "metaHash3", "certNum", 0, "")).to.be.reverted
        })
    })

    describe("Approve simple", function () {
        it("Should be reverted with not enough credit error", async function () {
            const {instance, owner, approver, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(approver).approve("hash")).to.be.reverted
        })
        it("Should be approved without error", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            let cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal("imageHash")
            expect(cert[4]).to.equal("metaHash")
            expect(cert[5]).to.equal(otherAccount.address)
            expect(cert[6]).to.equal(0)
            expect(cert[8]).to.equal("")
            await expect(instance.connect(approver).approve("hash")).not.to.be.reverted
            cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal("imageHash")
            expect(cert[4]).to.equal("metaHash")
            expect(cert[5]).to.equal(otherAccount.address)
            expect(cert[6]).to.equal(0)
            expect(cert[8]).to.equal("")
            const approveInfo = await instance.getApproveInfo("hash")
            expect(approveInfo[0]).to.equal("hash")
            expect(approveInfo[1]).to.equal(true)
            expect(approveInfo[2]).to.equal(approver.address)
            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[0]).to.equal("")
            expect(revokeInfo[1]).to.equal(false)
            expect(revokeInfo[2]).to.equal(ethers.constants.AddressZero)
        })
        it("should be reverted with error already revoked", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted
            await expect(instance.connect(approver).approve("hash")).to.be.reverted
        })
    })
    describe("Revoke simple", function () {
        it("Should be reverted with not enough credit error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 1)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).to.be.reverted
        })
        it("Should be reverted with not found error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 1)).not.to.be.reverted;
            await expect(instance.revoke("hash", "test")).to.be.reverted
        })
        it("Should be reverted with permission error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 1)).not.to.be.reverted;
            await expect(credit.mint(owner.address, 1)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.revoke("hash", "test")).to.be.reverted
        })
        it("Should be reverted with already revoked error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 3)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).to.be.reverted
        })
        it("Should be revoked without error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted

            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[1]).to.equal(true)
            expect(revokeInfo[2]).to.equal(otherAccount.address)
        })
        it("Should be revoked without error approver", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(approver).revoke("hash", "test")).not.to.be.reverted

            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[1]).to.equal(true)
            expect(revokeInfo[2]).to.equal(approver.address)
        })
        it("Should be revoked without error after approve 1", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(approver).approve("hash")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted

            const approveInfo = await instance.getApproveInfo("hash")
            expect(approveInfo[0]).to.equal("")
            expect(approveInfo[1]).to.equal(false)
            expect(approveInfo[2]).to.equal(ethers.constants.AddressZero)
            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[1]).to.equal(true)
            expect(revokeInfo[2]).to.equal(otherAccount.address)
        })
        it("Should be revoked without error after approve 2", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(approver).approve("hash")).not.to.be.reverted
            await expect(instance.connect(approver).revoke("hash", "test")).not.to.be.reverted

            const approveInfo = await instance.getApproveInfo("hash")
            expect(approveInfo[0]).to.equal("")
            expect(approveInfo[1]).to.equal(false)
            expect(approveInfo[2]).to.equal(ethers.constants.AddressZero)
            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[1]).to.equal(true)
            expect(revokeInfo[2]).to.equal(approver.address)
        })
    })
    describe("Issue and revoke complex", function () {
        it("Reverted because of duplicated certnum", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).addCertification("hash2", "imageHash2", "metaHash2", "certNum", 0, "")).to.be.reverted
        })
        it("Reverted because of duplicated hash", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash2", "metaHash2", "certNum", 0, "")).to.be.reverted
        })
        it("issue after revoke should be success", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted


            const approveInfo = await instance.getApproveInfo("hash")
            expect(approveInfo[0]).to.equal("")
            expect(approveInfo[1]).to.equal(false)
            expect(approveInfo[2]).to.equal(ethers.constants.AddressZero)
            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[0]).to.equal("")
            expect(revokeInfo[1]).to.equal(false)
            expect(revokeInfo[2]).to.equal(ethers.constants.AddressZero)
        })
        it("issue after revoke should be success", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(credit.mint(approver.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted
            await expect(instance.connect(otherAccount).addCertification("hash", "imageHash", "metaHash", "certNum", 0, "")).not.to.be.reverted

            const approveInfo = await instance.getApproveInfo("hash")
            expect(approveInfo[0]).to.equal("")
            expect(approveInfo[1]).to.equal(false)
            expect(approveInfo[2]).to.equal(ethers.constants.AddressZero)
            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[0]).to.equal("")
            expect(revokeInfo[1]).to.equal(false)
            expect(revokeInfo[2]).to.equal(ethers.constants.AddressZero)
        })
    })

    describe("Add approved certification", () => {
        it("Should be issued without error", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            const encodePacked = ethers.utils.solidityKeccak256(['string', 'string'], ["metaHash", "certNum"]);
            const hashedMessage = ethers.utils.arrayify(encodePacked);
            const signature = await approver.signMessage(hashedMessage);
            await expect(instance.connect(otherAccount).addApprovedCertification("hash", "imageHash", "metaHash", "certNum", 0, "", signature)).not.to.be.reverted
            cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal("imageHash")
            expect(cert[4]).to.equal("metaHash")
            expect(cert[5]).to.equal(otherAccount.address)
            expect(cert[6]).to.equal(0)
            expect(cert[8]).to.equal("")
            const approveInfo = await instance.getApproveInfo("hash")
            expect(approveInfo[0]).to.equal("hash")
            expect(approveInfo[1]).to.equal(true)
            expect(approveInfo[2]).to.equal(approver.address)
            const revokeInfo = await instance.getRevokeInfo("hash")
            expect(revokeInfo[0]).to.equal("")
            expect(revokeInfo[1]).to.equal(false)
            expect(revokeInfo[2]).to.equal(ethers.constants.AddressZero)
        })
        it("Should be reverted with wrong data error", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            const encodePacked = ethers.utils.solidityKeccak256(['string', 'string'], ["different metaHash", "certNum"]);
            const hashedMessage = ethers.utils.arrayify(encodePacked);
            const signature = await approver.signMessage(hashedMessage);
            await expect(instance.connect(otherAccount).addApprovedCertification("hash", "imageHash", "metaHash", "certNum", 0, "", signature)).to.be.reverted
        })
        it("Should be reverted with wrong data error", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            const encodePacked = ethers.utils.solidityKeccak256(['string', 'string'], ["metaHash", "different certNum"]);
            const hashedMessage = ethers.utils.arrayify(encodePacked);
            const signature = await approver.signMessage(hashedMessage);
            await expect(instance.connect(otherAccount).addApprovedCertification("hash", "imageHash", "metaHash", "certNum", 0, "", signature)).to.be.reverted
        })
        it("Should be reverted with wrong data error", async function () {
            const {instance, owner, credit, otherAccount, approver} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            const encodePacked = ethers.utils.solidityKeccak256(['string', 'string'], ["metaHash", "different certNum"]);
            const hashedMessage = ethers.utils.arrayify(encodePacked);
            const signature = await otherAccount.signMessage(hashedMessage);
            await expect(instance.connect(otherAccount).addApprovedCertification("hash", "imageHash", "metaHash", "certNum", 0, "", signature)).to.be.reverted
        })
    })
})
