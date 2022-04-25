// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract IssuerRegistration is Initializable, OwnableUpgradeable {

    struct Issuer {
        uint256 id;
        string name;
        string regnum;
        string description;
        string category;
        address addr;
        string metaDataUrl;
        bool isActive;
    }

    uint256 public lastIssuerID;
    mapping(address => Issuer) public issuers;
    mapping(address => uint256) public issuerIDs;

    address[] public issuerAddresses;

    function initialize() public initializer {
        lastIssuerID = 0;
        __Ownable_init();
    }

    function addIssuer(address _addr, string memory _name, string memory _regnum, string memory _description,
        string memory _category, string memory _metaDataUrl) public onlyOwner {
        require(issuerIDs[_addr] == 0, "Issuer already exists");
        Issuer memory issuer = issuers[_addr];
        issuerIDs[_addr] = ++lastIssuerID;
        issuer.name = _name;
        issuer.regnum = _regnum;
        issuer.description = _description;
        issuer.category = _category;
        issuer.addr = _addr;
        issuer.metaDataUrl = _metaDataUrl;
        issuer.isActive = true;
        issuers[_addr] = issuer;
        issuerAddresses.push(_addr);
    }

    function updateIssuer(address _addr, string memory _name, string memory _regnum, string memory _description,
        string memory _category, string memory _metaDataUrl, bool isActive) public onlyOwner {
        require(issuerIDs[_addr] > 0, "Issuer not found");
        Issuer memory issuer = issuers[_addr];
        issuer.name = _name;
        issuer.regnum = _regnum;
        issuer.description = _description;
        issuer.category = _category;
        issuer.addr = _addr;
        issuer.metaDataUrl = _metaDataUrl;
        issuer.isActive = isActive;
        issuers[_addr] = issuer;
    }

    function deactivateIssuer(address _addr) public onlyOwner {
        require(issuerIDs[_addr] > 0, "Issuer not found");
        Issuer memory issuer = issuers[_addr];
        issuer.isActive = false;
        issuers[_addr] = issuer;
    }

    function getIssuerAddresses() view public returns (address[] memory) {
        return issuerAddresses;
    }

    function getIssuer(address _addr) view public returns (Issuer memory) {
        return issuers[_addr];
    }

    function isVerifiedIssuer(address _addr) view public returns (bool) {
        return issuers[_addr].isActive;
    }
}
