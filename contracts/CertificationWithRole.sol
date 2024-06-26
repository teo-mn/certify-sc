// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./IssuerRegistration.sol";
import "./SharedStructs.sol";
import "./Credits.sol";

contract CertificationRegistrationWithRole is Initializable, OwnableUpgradeable, AccessControlUpgradeable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Certification {
        uint256 id;
        string certNum; // Дипломын дугаар
        string hash; // файлын хаш
        address issuer;
        uint256 expireDate;
        uint256 createdAt;
        bool isRevoked;
        string version;
        string description;
        string revokerName;
        uint256 revokedAt;
        string txid;
        string[] childHashes;
    }

    event Issued(address indexed issuer, string hash, string certNum, uint256 timestamp);
    event Revoked(address indexed revoker, string  hash, string certNum, uint256 timestamp);
    event IssuerRegistrationAddressChanged(address oldAddr, address newAddr, uint256 timestamp);
    event CreditAddressChanged(address oldAddr, address newAddr, uint256 timestamp);

    uint256 public id;
    address public creditAddress;
    mapping(string => Certification) public certifications; // hash->object
    mapping(uint256 => Certification) public mapById;
    mapping(string => Certification) public mapByCertNum;
    mapping(string => uint8) public childHashCount;

    address public issuerRegistrationAddress;

    mapping(string => string) public parentHash;

    function initialize(address _creditAddress, address _issuerRegistrationAddress) public initializer {
        id = 0;
        __Ownable_init();
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        creditAddress = _creditAddress;
        issuerRegistrationAddress = _issuerRegistrationAddress;
    }

    function setIssuerRegistrationAddress(address _issuerRegistrationAddress) public onlyOwner {
        require(_issuerRegistrationAddress != address(0), "Invalid address");
        address oldAddr = issuerRegistrationAddress;
        issuerRegistrationAddress = _issuerRegistrationAddress;
        emit IssuerRegistrationAddressChanged(oldAddr, _issuerRegistrationAddress, block.timestamp);
    }

    function setCreditAddress(address _creditAddress) public onlyOwner {
        require(_creditAddress != address(0), "Invalid address");
        creditAddress = _creditAddress;
    }

    // Certificate, диплом шинээр бүртгэх
    function addCertification(string memory _hash,
        string memory _certNum,
        uint256 _expireDate,
        string memory _version,
        string memory _desc)
    public onlyRole(ISSUER_ROLE) returns (uint256) {
        string[] memory childHashes;
        return addCertificationUtil(_hash, childHashes, _certNum, _expireDate, _version, _desc);
    }

    // Certificate, диплом шинээр бүртгэх
    function addCertification(string memory _hash,
        string[] memory childHashes,
        string memory _certNum,
        uint256 _expireDate,
        string memory _version, string memory _desc)
    public onlyRole(ISSUER_ROLE) returns (uint256) {
        uint256 new_id = addCertificationUtil(_hash, childHashes, _certNum, _expireDate, _version, _desc);
        return new_id;
    }

    function addCertificationUtil(string memory _hash,
        string[] memory _childHashes,
        string memory _certNum,
        uint256 _expireDate,
        string memory _version,
        string memory _desc)
    internal returns (uint256) {
        // check exists
        Certification memory cert = getCertification(_hash);
        require(cert.isRevoked || cert.id == 0, "Certificate already registered");
        // check credit
        require(_getCredit(msg.sender) > 0, "Not enough credit");
        // check _expireDate
        require(_expireDate == 0 || block.timestamp < _expireDate, "Expire date can't be past");
        require(_expireDate == 0 || _expireDate < block.timestamp + 1000 * 365 * 24 * 60 * 60,
            "Expire date timestamp should be in seconds");

        // use credit
        _useCredit(msg.sender);

        // create
        cert.id = ++id;
        cert.childHashes = _childHashes;

        for (uint8 i = 0; i < _childHashes.length; i++) {
            childHashCount[_childHashes[i]] = childHashCount[_childHashes[i]] + 1;
        }

        cert.certNum = _certNum;
        cert.hash = _hash;
        cert.issuer = msg.sender;
        cert.expireDate = _expireDate;
        cert.createdAt = block.timestamp;
        cert.isRevoked = false;
        cert.version = _version;
        cert.description = _desc;
        cert.revokerName = '';
        cert.revokedAt = 0;

        certifications[_hash] = cert;
        mapById[cert.id] = cert;
        mapByCertNum[_certNum] = cert;

        emit Issued(msg.sender, _hash, _certNum, block.timestamp);
        return cert.id;
    }

    function _getCredit(address addr) view internal returns (uint256) {
        Credits creditsContract = Credits(creditAddress);
        return creditsContract.balanceOf(addr);
    }

    function _useCredit(address addr) internal returns (bool) {
        Credits creditsContract = Credits(creditAddress);
        return creditsContract.burn(addr, 1);
    }

    // сертификатын мэдээллийг файлын хашиар хайж олох
    function getCertification(string memory hash) view public returns (Certification memory) {
        return certifications[hash];
    }

    // сертификатын мэдээллийг No(дипломын дугаараар хайж олох)
    function getCertificationByCertNum(string memory certNum) view public returns (Certification memory) {
        return mapByCertNum[certNum];
    }

    // сертификатын мэдээллийг ID аар хайж олох
    function getCertificationByID(uint256 ID) view public returns (Certification memory) {
        return mapById[ID];
    }

    // дипломыг буцаах
    function revoke(string memory hash, string memory revokerName) public onlyRole(ISSUER_ROLE) {
        Certification memory cert = certifications[hash];
        revokeUtil(cert, revokerName);
    }

    // дипломыг буцаах
    function revokeById(uint256 ID, string memory revokerName) public onlyRole(ISSUER_ROLE)  {
        Certification memory cert = mapById[ID];
        revokeUtil(cert, revokerName);
    }

    function revokeUtil(Certification memory cert, string memory revokerName) internal {
        // check exists
        require(cert.id > 0, "Certification not found");
        require(cert.isRevoked == false, "Certification already revoked");
        // check credit
        require(_getCredit(msg.sender) > 0, "Not enough credit");

        // use credit
        _useCredit(msg.sender);

        // revoke
        cert.isRevoked = true;
        cert.revokerName = revokerName;
        cert.revokedAt = block.timestamp;
        certifications[cert.hash] = cert;
        mapById[cert.id] = cert;
        mapByCertNum[cert.certNum] = cert;

        // child hashes update
        for (uint8 i = 0; i < cert.childHashes.length; i++) {
            if (childHashCount[cert.childHashes[i]] != 0) {
                childHashCount[cert.childHashes[i]] = childHashCount[cert.childHashes[i]] - 1;
            }
        }

        emit Revoked(msg.sender, cert.hash, cert.certNum, block.timestamp);
    }

    function getChildHashCount(string memory hash) view public returns (uint8) {
        return childHashCount[hash];
    }

    // Кредит цэнэглэх
    function chargeCredit(address addr, uint256 credit) payable public onlyOwner {
        require(credit == 0, "Deprecated");
        require(addr == address(0), "Deprecated");
    }

    function getCredit(address addr) view public returns (uint256) {
        return _getCredit(addr);
    }

    function getIssuer(address issuer) view public returns (SharedStructs.Issuer memory) {
        IssuerRegistration ir = IssuerRegistration(issuerRegistrationAddress);
        return ir.getIssuer(issuer);
    }

    function addTransactionId(string memory _hash, string memory _txid) public {
        Certification memory cert = certifications[_hash];
        require(cert.id > 0 && !cert.isRevoked, "Not found");
        require(cert.issuer == msg.sender, "Permission denied");
        cert.txid = _txid;
        certifications[_hash] = cert;
        mapById[cert.id] = cert;
        mapByCertNum[cert.certNum] = cert;
    }
}
