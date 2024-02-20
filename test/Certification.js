// noinspection DuplicatedCode

const {ethers, upgrades} = require('hardhat');
const {expect} = require('chai');
describe("Credits Contract", function () {
    async function deploy() {
        const [owner, otherAccount] = await ethers.getSigners();
        const Class = await ethers.getContractFactory('CertificationRegistration');
        console.log('Deploying certification...');
        const instance = await upgrades.deployProxy(Class);
        await instance.deployed();
        const ClassCredit = await ethers.getContractFactory('Credits');
        console.log('Deploying credits...');
        const credit = await upgrades.deployProxy(ClassCredit);
        await credit.deployed();
        await instance.setCreditAddress(credit.address)
        await credit.allowBurnToAddress(instance.address)

        return {instance, owner, otherAccount, credit};
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
            await expect(instance.addCertification("hash", "certNum", 0, "", "")).to.be.reverted
        })
        it("Should be issued without error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "", "")).not.to.be.reverted
            const cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal(otherAccount.address)
            expect(cert[4]).to.equal(0)
            expect(cert[6]).to.equal(false)
            expect(cert[7]).to.equal("")
            expect(cert[8]).to.equal("")
            expect(cert[9]).to.equal("")
        })
    })
    describe("Revoke simple", function () {
        it("Should be reverted with not enough credit error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 1)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "", "")).not.to.be.reverted
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
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "", "")).not.to.be.reverted
            await expect(instance.revoke("hash", "test")).to.be.reverted
        })
        it("Should be reverted with already revoked error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 3)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "", "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).to.be.reverted
        })
        it("Should be revoked without error", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "", "")).not.to.be.reverted
            let cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal(otherAccount.address)
            expect(cert[4]).to.equal(0)
            expect(cert[6]).to.equal(false)
            expect(cert[7]).to.equal("")
            expect(cert[8]).to.equal("")
            expect(cert[9]).to.equal("")
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted
            cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal(otherAccount.address)
            expect(cert[4]).to.equal(0)
            expect(cert[6]).to.equal(true)
            expect(cert[7]).to.equal("")
            expect(cert[8]).to.equal("")
            expect(cert[9]).to.equal("test")
        })
    })
    describe("Issue and revoke complex", function () {
        it("Reverted because of duplicated certnum", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "", "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum2", 0, "2", "2")).to.be.reverted
            let cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal(otherAccount.address)
            expect(cert[4]).to.equal(0)
            expect(cert[6]).to.equal(false)
            expect(cert[7]).to.equal("")
            expect(cert[8]).to.equal("")
            expect(cert[9]).to.equal("")
        })
        it("should be reverted with negative expire date", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", -1, "", "")).to.be.reverted
        })
        it("should be reverted with past expire date", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            const now = new Date();
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", Math.floor(now.getTime() / 1000) - 10, "", "")).to.be.reverted
        })
        it("should be issued with correct expire date", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            const now = new Date();
            await instance.connect(otherAccount).addCertification("hash", "certNum", Math.floor(now.getTime() / 1000) + 100, "", "")
        })
        it("should be reverted if timestamp unit is incorrect", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            const now = new Date();
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", Math.floor(now.getTime()) + 100, "", "")).to.be.reverted
        })
        it("issue after revoke should be success", async function () {
            const {instance, owner, credit, otherAccount} = await deploy();
            await expect(credit.mint(otherAccount.address, 10)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "", "")).not.to.be.reverted
            await expect(instance.connect(otherAccount).revoke("hash", "test")).not.to.be.reverted;
            await expect(instance.connect(otherAccount).addCertification("hash", "certNum", 0, "2", "2")).not.to.be.reverted
            let cert = await instance.getCertification("hash")
            expect(cert[1]).to.equal("certNum")
            expect(cert[2]).to.equal("hash")
            expect(cert[3]).to.equal(otherAccount.address)
            expect(cert[4]).to.equal(0)
            expect(cert[6]).to.equal(false)
            expect(cert[7]).to.equal("2")
            expect(cert[8]).to.equal("2")
            expect(cert[9]).to.equal("")
        })
    })
})
