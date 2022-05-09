// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IssuerRegistration.sol";
import "./SharedStructs.sol";

contract CertificationRegistration is Initializable, OwnableUpgradeable {
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
    }

    uint256 public id;
    address public creditAddress;
    mapping (string => Certification) public certifications; // hash->object
    mapping (uint256 => Certification) public mapById;
    mapping (string => Certification) public mapByCertNum;

    mapping (address => uint256) public credits;
    address public issuerRegistrationAddress;

    function initialize() public initializer {
        id = 0;
        __Ownable_init();
    }

    function setIssuerRegistrationAddress(address _issuerRegistrationAddress) public onlyOwner {
        require(_issuerRegistrationAddress != address(0), "Invalid address");
        issuerRegistrationAddress = _issuerRegistrationAddress;
    }

    // Certificate, диплом шинээр бүртгэх
    function addCertification(string memory _hash, string memory _certNum, uint256 _expireDate, string memory _version, string memory _desc) public returns (uint256) {
        // check exists
        Certification memory cert = certifications[_hash];
        require(cert.isRevoked || cert.id == 0, "Certificate already registered");
        // check credit
        require(credits[msg.sender] > 0, "Not enough credit");
        //check _expireDate
        require(_expireDate == 0 || block.timestamp < _expireDate, "Expire date can't be past");
        require(_expireDate == 0 || _expireDate < block.timestamp + 1000 * 365 * 24 * 60 * 60,
            "Expire date timestamp should be in seconds");
        // create
        cert.id = ++id;
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
        // use credit
        credits[msg.sender] --;
        return cert.id;
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
    function revoke(string memory hash, string memory revokerName) public {
        Certification memory cert = certifications[hash];
        revokeUtil(cert, revokerName);
    }

    // дипломыг буцаах
    function revokeById(uint256 ID, string memory revokerName) public {
        Certification memory cert = mapById[ID];
        revokeUtil(cert, revokerName);
    }

    function revokeUtil(Certification memory cert, string memory revokerName) internal {
        // check exists
        require(cert.id > 0, "Certification not found");
        // check issuer
        require(msg.sender == cert.issuer, "Permission denied");
        require(cert.isRevoked == false, "Certification already revoked");
        // check credit
        require(credits[msg.sender] > 0, "Not enough credit");
        // revoke
        cert.isRevoked = true;
        cert.revokerName = revokerName;
        cert.revokedAt = block.timestamp;
        certifications[cert.hash] = cert;
        mapById[cert.id] = cert;
        mapByCertNum[cert.certNum] = cert;
        // use credit
        credits[msg.sender] --;
    }

    // Кредит цэнэглэх
    function chargeCredit(address addr, uint256 credit) payable public onlyOwner {
        require(msg.value > 0, 'Value can not be zero');
        credits[addr] += credit;
        payable(addr).transfer(msg.value);
    }

    function getCredit(address addr) view public returns (uint256) {
        return credits[addr];
    }

    function getIssuer(address issuer) view public returns (SharedStructs.Issuer memory) {
        IssuerRegistration ir = IssuerRegistration(issuerRegistrationAddress);
        return ir.getIssuer(issuer);
    }
}
