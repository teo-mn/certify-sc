// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

library SharedStructs {
    struct Issuer {
        uint256 id;
        string name;
        string regnum;
        string description;
        string category;
        address addr;
        string metaDataUrl;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
}
