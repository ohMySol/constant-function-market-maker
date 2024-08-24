// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Simple ERC20 contract for usage in CFMM contract. 
 * @notice User can mint `tokenA` tokens in this contract and use them in 
 * CFMM contract to add liquidity or swap.
 */
contract TokenA is ERC20 {
    constructor() ERC20("TokenA", "TA") {
    }

    function mint(uint256 _amount) external {
        _mint(msg.sender, _amount);
    }
}