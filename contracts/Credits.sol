// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract Credits is Initializable, OwnableUpgradeable, ERC20Upgradeable {
    mapping(address => bool) private burnRole;

    function initialize() public initializer {
        __Ownable_init();
        __ERC20_init('Verify Credit', 'VC');
        burnRole[msg.sender] = true;
    }


    event AllowedBurnToAddress(address account, uint256 timestamp);
    event DeniedBurnToAddress(address account, uint256 timestamp);


    function transfer(address to, uint256 amount) override public pure returns (bool) {
        require(to == address(0));
        require(amount == 0);
        return false;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) override public pure returns (bool) {
        require(from == address(0));
        require(to == address(0));
        require(amount == 0);
        return false;
    }

    function mint(address to, uint256 amount) public onlyOwner payable returns (bool) {
        _mint(to, amount);
        payable(to).transfer(msg.value);
        return true;
    }

    function burn(address from, uint256 amount) public returns (bool) {
        require(burnRole[msg.sender] == true, 'Permission Denied');
        _burn(from, amount);
        return true;
    }

    function allowBurnToAddress(address account) public onlyOwner returns (bool){
        burnRole[account] = true;
        emit AllowedBurnToAddress(account, block.timestamp);
        return true;
    }

    function denyBurnFromAddress(address account) public onlyOwner returns (bool){
        burnRole[account] = false;
        emit DeniedBurnToAddress(account, block.timestamp);
        return true;
    }
}
