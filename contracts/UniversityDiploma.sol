// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IssuerRegistration.sol";
import "./SharedStructs.sol";

contract UniversityDiploma is Initializable, OwnableUpgradeable {
    struct Certification {
        uint256 id;
        string certNum; // Дипломын дугаар
        string hash; // файлын хаш
        string imageHash; // metadata ороогүй үеийн файлын хаш
        string metaHash; // metadata хаш
        address issuer;
        uint256 expireDate;
        uint256 createdAt;
        string description;
        string txid;
    }

    struct RevokeInfo {
        string hash;
        bool isRevoked;
        address revokerAddress;
        string revokerName;
        string description;
        uint256 revokedAt;
    }

    struct ApproveInfo {
        string hash;
        bool isApproved;
        address approverAddress;
        uint256 approvedAt;
    }

    event Issued(address issuer, string hash, string metaHash, string certNum, uint256 timestamp);
    event Revoked(address revoker, string hash, string certNum, uint256 timestamp);
    event Approved(address approver, string hash, string certNum, uint256 timestamp);
    event IssuerRegistrationAddressChanged(address oldAddr, address newAddr, uint256 timestamp);
    event ApproverAddressChanged(address oldAddr, address newAddr, uint256 timestamp);
    event CreditCharged(address to, uint256 value, uint256 timestamp);

    uint256 public id;
    address public creditAddress;
    address public approver;

    mapping(string => Certification) public certifications; // hash->object
    mapping(string => Certification) public mapByCertNum;
    mapping(string => RevokeInfo) public revokeInfos;
    mapping(string => ApproveInfo) public approveInfos;

    mapping(address => uint256) public credits;
    address public issuerRegistrationAddress;

    function initialize() public initializer {
        id = 0;
        __Ownable_init();
    }

    function setIssuerRegistrationAddress(address _issuerRegistrationAddress) public onlyOwner {
        require(_issuerRegistrationAddress != address(0), "Invalid address");
        address oldAddr = issuerRegistrationAddress;
        issuerRegistrationAddress = _issuerRegistrationAddress;

        emit IssuerRegistrationAddressChanged(oldAddr, _issuerRegistrationAddress, block.timestamp);
    }

    function setApproverAddress(address _approverAddress) public onlyOwner {
        require(_approverAddress != address(0), "Invalid address");
        address old = approver;
        approver = _approverAddress;

        emit ApproverAddressChanged(old, _approverAddress, block.timestamp);
    }

    // Certificate, диплом шинээр бүртгэх
    function addCertification(string memory _hash, string memory _imageHash, string memory _metaHash,
        string memory _certNum, uint256 _expireDate, string memory _desc) public returns (uint256) {
        // check exists
        Certification memory cert = certifications[_hash];
        RevokeInfo memory revokeInfo = revokeInfos[_hash];
        require(revokeInfo.isRevoked || cert.id == 0, "Certificate already registered");
        // check credit
        require(credits[msg.sender] > 0, "Not enough credit");
        //check _expireDate
        require(_expireDate == 0 || block.timestamp < _expireDate, "Expire date can't be past");
        require(_expireDate == 0 || _expireDate < block.timestamp + 1000 * 365 * 24 * 60 * 60,
            "Expire date timestamp should be in seconds");
        // create
        cert.id = ++id;
        cert.hash = _hash;
        cert.metaHash = _metaHash;
        cert.imageHash = _imageHash;
        cert.certNum = _certNum;
        cert.issuer = msg.sender;
        cert.expireDate = _expireDate;
        cert.createdAt = block.timestamp;
        cert.description = _desc;

        certifications[_hash] = cert;
        mapByCertNum[_certNum] = cert;
        // use credit
        credits[msg.sender] --;

        emit Issued(msg.sender, _hash, _metaHash, _certNum, block.timestamp);
        return cert.id;
    }

    function approve(string memory _hash) public {
        require(msg.sender == approver, "Permission Denied");
        Certification memory cert = certifications[_hash];
        require(cert.id > 0, "Not Found");
        RevokeInfo memory revokeInfo = revokeInfos[_hash];
        ApproveInfo memory approveInfo = approveInfos[_hash];
        require(approveInfo.isApproved == false, "Already approved");
        require(revokeInfo.isRevoked == false, "Revoked certification");
        approveInfo.isApproved = true;
        approveInfo.hash = _hash;
        approveInfo.approvedAt = block.timestamp;
        approveInfo.approverAddress = msg.sender;

        mapByCertNum[cert.certNum] = cert;
        revokeInfos[cert.hash] = revokeInfo;
        approveInfos[cert.hash] = approveInfo;
        // use credit
        credits[msg.sender] --;

        emit Approved(msg.sender, _hash, cert.certNum, block.timestamp);
    }

    // сертификатын мэдээллийг файлын хашиар хайж олох
    function getCertification(string memory hash) view public returns (Certification memory) {
        return certifications[hash];
    }

    // сертификатын revoke мэдээллийг файлын хашиар хайж олох
    function getRevokeInfo(string memory hash) view public returns (RevokeInfo memory) {
        return revokeInfos[hash];
    }
    // сертификатын approve мэдээллийг файлын хашиар хайж олох
    function getApproveInfo(string memory hash) view public returns (ApproveInfo memory) {
        return approveInfos[hash];
    }

    // сертификатын мэдээллийг No(дипломын дугаараар хайж олох)
    function getCertificationByCertNum(string memory certNum) view public returns (Certification memory) {
        return mapByCertNum[certNum];
    }

    // дипломыг буцаах
    function revoke(string memory hash, string memory revokerName) public {
        Certification memory cert = certifications[hash];
        revokeUtil(cert, revokerName);
    }

    function revokeUtil(Certification memory cert, string memory revokerName) internal {
        // check exists
        require(cert.id > 0, "Certification not found");
        // check issuer
        require(msg.sender == cert.issuer || msg.sender == approver, "Permission denied");
        RevokeInfo memory revokeInfo = revokeInfos[cert.hash];
        ApproveInfo memory approveInfo = approveInfos[cert.hash];
        require(revokeInfo.isRevoked == false, "Certification already revoked");
        // check credit
        require(credits[msg.sender] > 0, "Not enough credit");
        // revoke
        revokeInfo.isRevoked = true;
        approveInfo.isApproved = false;
        revokeInfo.revokerName = revokerName;
        revokeInfo.revokedAt = block.timestamp;
        revokeInfo.revokerAddress = msg.sender;
        certifications[cert.hash] = cert;
        mapByCertNum[cert.certNum] = cert;
        revokeInfos[cert.hash] = revokeInfo;
        approveInfos[cert.hash] = approveInfo;
        // use credit
        credits[msg.sender] --;

        emit Revoked(msg.sender, cert.hash, cert.certNum, block.timestamp);
    }

    // Кредит цэнэглэх
    function chargeCredit(address addr, uint256 credit) payable public onlyOwner {
        require(msg.value > 0, 'Value can not be zero');
        credits[addr] += credit;
        payable(addr).transfer(msg.value);

        emit CreditCharged(addr, credit, block.timestamp);
    }

    function getCredit(address addr) view public returns (uint256) {
        return credits[addr];
    }

    function getIssuer(address issuer) view public returns (SharedStructs.Issuer memory) {
        IssuerRegistration ir = IssuerRegistration(issuerRegistrationAddress);
        return ir.getIssuer(issuer);
    }

    function addTransactionId(string memory _hash, string memory _txid) public {
        Certification memory cert = certifications[_hash];
        RevokeInfo memory revokeInfo = revokeInfos[_hash];
        require(cert.id > 0 && !revokeInfo.isRevoked, "Not found");
        require(cert.issuer == msg.sender, "Permission denied");
        cert.txid = _txid;
        certifications[_hash] = cert;
        mapByCertNum[cert.certNum] = cert;
    }
}
