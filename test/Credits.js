
const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');
const {loadFixture} = require("ethereum-waffle");
describe("Credits Contract", function () {
    async function deploy() {
        const [owner, otherAccount] = await ethers.getSigners();
        const Class = await ethers.getContractFactory('Credits');
        console.log('Deploying credits...');
        const instance = await upgrades.deployProxy(Class);
        await instance.deployed();

        return {instance, owner, otherAccount};
    }
    describe("Deployment", function () {
        it("Name should be matched", async function () {
            const {instance, owner} = await loadFixture(deploy);
            expect(await instance.name()).to.equal("Verify Credit");
        })
        it("Balance should be matched", async function () {
            const {instance, owner} = await loadFixture(deploy);
            expect(await instance.balanceOf(owner.address)).to.equal(0);
        })
    })
    describe("Transfer", function () {
        it("Transfer should be unavailable", async function () {
            const {instance, owner, otherAccount} = await loadFixture(deploy);
            await expect(instance.transfer(otherAccount.address, 1)).to.be.reverted;
        })
        it("TransferFrom should be unavailable", async function () {
            const {instance, owner, otherAccount} = await loadFixture(deploy);
            await expect(instance.transferFrom(owner.address, otherAccount.address, 1)).to.be.reverted;
        })
    })
    describe("Mint", function () {
        it("Mint should be successfully", async function () {
            const {instance, owner, otherAccount} = await loadFixture(deploy);
            expect(await instance.balanceOf(otherAccount.address)).to.equal(0);
            await expect(instance.mint(otherAccount.address, 10)).not.to.be.reverted;
            expect(await instance.balanceOf(otherAccount.address)).to.equal(10);
        })
        it("Mint should be reverted", async function () {
            const {instance, owner, otherAccount} = await loadFixture(deploy);
            expect(await instance.balanceOf(otherAccount.address)).to.equal(10);
            await expect(instance.connect(otherAccount).mint(otherAccount.address, 10)).to.be.reverted;
            expect(await instance.balanceOf(otherAccount.address)).to.equal(10);
        })
    })
    describe("Burn", function () {
        it("Burn should be successfully", async function () {
            const {instance, owner, otherAccount} = await loadFixture(deploy);
            expect(await instance.balanceOf(otherAccount.address)).to.equal(10);
            await expect(instance.burn(otherAccount.address, 1)).not.to.be.reverted;
            expect(await instance.balanceOf(otherAccount.address)).to.equal(9);
        })
        it("Burn should be reverted", async function () {
            const {instance, owner, otherAccount} = await loadFixture(deploy);
            await expect(instance.connect(otherAccount).burn(otherAccount.address, 1)).to.be.reverted;
            expect(await instance.balanceOf(otherAccount.address)).to.equal(9);
        })
        it("Burn role", async function () {
            const {instance, owner, otherAccount} = await loadFixture(deploy);
            await expect(instance.connect(otherAccount).burn(otherAccount.address, 1)).to.be.reverted;
            expect(await instance.balanceOf(otherAccount.address)).to.equal(9);
            await expect(instance.allowBurnToAddress(otherAccount.address)).not.to.be.reverted;
            await expect(instance.connect(otherAccount).burn(otherAccount.address, 1)).not.to.be.reverted;
            expect(await instance.balanceOf(otherAccount.address)).to.equal(8);
            await expect(instance.denyBurnFromAddress(owner.address)).not.to.be.reverted;
            await expect(instance.burn(otherAccount.address, 1)).to.be.reverted;
            expect(await instance.balanceOf(otherAccount.address)).to.equal(8);
        })
    })
})