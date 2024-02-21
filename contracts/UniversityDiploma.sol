// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IssuerRegistration.sol";
import "./SharedStructs.sol";
import "./Credits.sol";

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

    function setCreditAddress(address _creditAddress) public onlyOwner {
        require(_creditAddress != address(0), "Invalid address");
        creditAddress = _creditAddress;
    }

    function _getCredit(address addr) view internal returns (uint256) {
        Credits creditsContract = Credits(creditAddress);
        return creditsContract.balanceOf(addr);
    }

    function _useCredit(address addr) internal returns (bool) {
        Credits creditsContract = Credits(creditAddress);
        return creditsContract.burn(addr, 1);
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
        validateCertificationRequest(_hash, _imageHash, _metaHash, _certNum, _expireDate, _desc);

        // use credit
        _useCredit(msg.sender);

        // create
        return addCertificationUtil(_hash, _imageHash, _metaHash, _certNum, _expireDate, _desc);
    }

    function validateCertificationRequest(string memory _hash, string memory _imageHash, string memory _metaHash,
        string memory _certNum, uint256 _expireDate, string memory _desc) internal {
        Certification memory cert = certifications[_hash];
        RevokeInfo memory revokeInfo = revokeInfos[_hash];
        require(revokeInfo.isRevoked || cert.id == 0, "Certificate already registered");
        checkCertNum(_certNum);
        // check credit
        require(_getCredit(msg.sender) > 0, "Not enough credit");
        // check _expireDate
        require(_expireDate == 0 || block.timestamp < _expireDate, "Expire date can't be past");
        require(_expireDate == 0 || _expireDate < block.timestamp + 1000 * 365 * 24 * 60 * 60,
            "Expire date timestamp should be in seconds");
    }
    function splitSignature(
        bytes memory sig
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function getMetaCertNumHash(string memory _metaHash, string memory _certNum) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_metaHash, _certNum));
    }

    function recoverSigner(string memory _metaHash, string memory _certNum, bytes memory _signature) internal returns (address) {
        bytes32 messageHash = getMetaCertNumHash(_metaHash, _certNum);
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    // Certificate, диплом шинээр бүртгэх
    function addApprovedCertification(string memory _hash, string memory _imageHash, string memory _metaHash,
        string memory _certNum, uint256 _expireDate, string memory _desc, bytes memory signature) public returns (uint256) {
        address signer = recoverSigner(_metaHash, _certNum, signature);
        require(signer == approver, "Wrong signature");
        validateCertificationRequest(_hash, _imageHash, _metaHash, _certNum, _expireDate, _desc);
        _useCredit(msg.sender);

        uint256 cert_id = addCertificationUtil(_hash, _imageHash, _metaHash, _certNum, _expireDate, _desc);
        approveUtil(_hash, approver);
        return cert_id;
    }

    function addCertificationUtil(string memory _hash, string memory _imageHash, string memory _metaHash,
        string memory _certNum, uint256 _expireDate, string memory _desc) internal returns (uint256){
        Certification memory cert = certifications[_hash];
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

        RevokeInfo memory revokeInfo = RevokeInfo('', false, address(0), '', '', 0);
        revokeInfos[cert.hash] = revokeInfo;

        emit Issued(msg.sender, _hash, _metaHash, _certNum, block.timestamp);
        return cert.id;
    }

    function checkCertNum(string memory _certNum) internal view {
        Certification memory cert = mapByCertNum[_certNum];
        RevokeInfo memory revokeInfo = revokeInfos[cert.hash];
        require(cert.id == 0 || revokeInfo.isRevoked == true, "Already registered certification number");
    }

    function approve(string memory _hash) public {
        require(msg.sender == approver, "Permission Denied");
        Certification memory cert = certifications[_hash];
        require(cert.id > 0, "Not Found");
        RevokeInfo memory revokeInfo = revokeInfos[_hash];
        ApproveInfo memory approveInfo = approveInfos[_hash];
        require(approveInfo.isApproved == false, "Already approved");
        require(revokeInfo.isRevoked == false, "Revoked certification");
        require(_getCredit(msg.sender) > 0, "Not enough credit");

        _useCredit(msg.sender);
        approveUtil(_hash, msg.sender);
    }

    function approveUtil(string memory _hash, address _approver) internal {
        Certification memory cert = certifications[_hash];
        ApproveInfo memory approveInfo = ApproveInfo(_hash, true, _approver, block.timestamp);
        approveInfos[cert.hash] = approveInfo;
        emit Approved(_approver, _hash, cert.certNum, block.timestamp);
    }

    function getCertification(string memory hash) view public returns (Certification memory) {
        return certifications[hash];
    }

    function getRevokeInfo(string memory hash) view public returns (RevokeInfo memory) {
        return revokeInfos[hash];
    }
    function getApproveInfo(string memory hash) view public returns (ApproveInfo memory) {
        return approveInfos[hash];
    }

    function getCertificationByCertNum(string memory certNum) view public returns (Certification memory) {
        return mapByCertNum[certNum];
    }

    function revoke(string memory hash, string memory revokerName) public {
        Certification memory cert = certifications[hash];
        revokeUtil(cert, revokerName);
    }

    function revokeUtil(Certification memory cert, string memory revokerName) internal {
        require(cert.id > 0, "Certification not found");
        require(msg.sender == cert.issuer || msg.sender == approver, "Permission denied");
        RevokeInfo memory revokeInfo = revokeInfos[cert.hash];
        require(revokeInfo.isRevoked == false, "Certification already revoked");
        require(_getCredit(msg.sender) > 0, "Not enough credit");

        _useCredit(msg.sender);
        certifications[cert.hash] = cert;
        mapByCertNum[cert.certNum] = cert;
        revokeInfo = RevokeInfo(cert.hash, true, msg.sender, revokerName, '', 0);
        revokeInfos[cert.hash] = revokeInfo;
        ApproveInfo memory approveInfo = ApproveInfo('', false, address(0), 0);
        approveInfos[cert.hash] = approveInfo;

        emit Revoked(msg.sender, cert.hash, cert.certNum, block.timestamp);
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
