// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CfmmErrors} from "../contracts/interfaces/CustomErrors.sol";

contract CFMM is CfmmErrors {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalSharesSupply;
    
    mapping(address => uint256) public shareBalance;

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    /**
     * @notice User can swap his `tokenA` for `tokenB` or vice versa.
     * @dev 1. Function takes `_tokenIn` prameter, and set up the `tokenIn` and 
     * `tokenOut` tokens.
     * 2. User send `tokenIn` tokens to CFMM contract, and swap function calculates 
     * the `amountOut` value that user will receive back. 
     * 3. Each swap takes 0.3% fee from `_amountIn` value. 
     * @param _tokenIn - address of the token for sell.
     * @param _amountIn - amount of tokens user want to sell. 
     */
    function swap(address _tokenIn, uint256 _amountIn) external returns (uint256 amountOut) {
        if(_tokenIn != address(tokenA) && _tokenIn != address(tokenB)) {
            revert CFMM_UnsupportedTokenAddress();
        }
        if (_amountIn <= 0) {
            revert CFMM_InsufficientAmountIn();
        }
        (
            IERC20 tokenIn, 
            IERC20 tokenOut, 
            uint256 reserveIn, 
            uint256 reserveOut
        ) = _setInOutToken(_tokenIn);
        tokenIn.transferFrom(msg.sender, address(this), _amountIn);
        // 2. Calculate amount of tokens out(include fees), fee 0.3%
        uint amountInAfterFee = (_amountIn * 997) / 1000;
        // Formula how much tokens to return: y * dx / (x + dx) = dy 
        amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);
        // 3. Transfer calculated tokenout amount to msg.sender
        if (amountOut <= 0) {
            revert CFMM_InsufficientAmountOut();   
        }
        tokenOut.transfer(msg.sender, amountOut);
        // 4. Upd reserves
        uint256 balanceA = tokenA.balanceOf(address(this));
        uint256 balanceB = tokenB.balanceOf(address(this));
        _updateReserves(balanceA, balanceB);
    }

    /**
     * @notice Users(future LPs) can add liquidity of the token pair in the liquidity pool,
     * and earn fees.
     * @dev Function takes `_amountA` and `_amountB` arguments, then fund a pool with them.
     * Calculates the amount of `shares` to be minted to `msg.sender` and mint them. And in
     * the end update reserves of `tokenA` and `tokenB` in the contract with new balances.
     */
    function addLiquidity(uint256 _amountA, uint256 _amountB) external returns (uint256 shares) {
        if (reserveA > 0 || reserveB > 0) {
            // Check that price for tokens remains the same by applying formula((dx/dy )= (x/y)) or ((dy*x )==(dx*y))
            if (_amountB * reserveA != _amountA * reserveB) {
                revert CFMM_AssetsRatioCanNotBeChanged();
            }
        }
        // Fund pool with tokenA & tokenB
        tokenA.transferFrom(msg.sender, address(this), _amountA);
        tokenB.transferFrom(msg.sender, address(this), _amountB);
        uint256 balanceA = tokenA.balanceOf(address(this));
        uint256 balanceB = tokenB.balanceOf(address(this));
        uint256 _totalSharesSupply = totalSharesSupply;
        // Mint LP tokens(shares)(first calculate how much shares to mint)
        // Formulas: 1. Total liquidity = f(x, y) = sqrt(x, y)
        // 2. Shares to mint = dx / x * T = dy / y * T 
        if (_totalSharesSupply == 0) {
            shares = _sqrt(_amountA * _amountB);
        } else {
            shares = _min(
                (_amountA * _totalSharesSupply) / reserveA,
                (_amountB * _totalSharesSupply) / reserveB
            );
        }
        if (shares <= 0 ) {
            revert CFMM_NotEnoughLiquidity();
        }
        _mintShares(msg.sender, shares);
        // Update reserves(updating them internally from security reasons, to not allow users to mint more shares they can and manipulate with the price)
        _updateReserves(balanceA, balanceB);
    }

    /**
     * @notice LPs can call this function to return their tokens from a liquidity pool,
     * plus earned fees. 
     * @dev Function calculates the returned amount of `amountA` tokens and `amountB` 
     * tokens based on the LP `_shares` and  `totalSharesSupply`. Then burn `_shares`,
     * update reserves with new balances and transfer `amountA` and `amountB` to `msg.sender`.
     */
    function withdrawLiquidity(uint256 _shares) external returns (uint256 amountA, uint256 amountB) {
        if (_shares <= 0) {
            revert CFMM_NotEnoughShares();
        }
        // Calculate the amountA and amountB of tokens for withdraw(should be proportional to shares)
        // Formulas: 1. dx = s / T * x
        // 2. dy = s / T * y
        uint256 _totalSharesSupply = totalSharesSupply;
        uint256 balanceA = tokenA.balanceOf(address(this));
        uint256 balanceB = tokenB.balanceOf(address(this));
        amountA = (balanceA * _shares) / _totalSharesSupply;
        amountB = (balanceB * _shares) / _totalSharesSupply;
        if (amountA <= 0 && amountB <= 0 ) {
            revert CFMM_InsufficientLiquidityReturnAmount();
        }
        // Burn shares
        _burnShares(msg.sender, _shares);
        // Update reservs
        _updateReserves(balanceA - amountA, balanceB - amountB);
        // Transfer tokens to msg.sender
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
    }

    /**
     * @dev Fucntion updates `reserveA` and `reserveB` for a specified amounts:
     * `_newReserveA` and `_newReserveB`
     * @param _newReserveA - updated `tokenA` tokens amount in the contract.
     * @param _newReserveB  - updated `tokenb` tokens amount in the contract.
     */
    function _updateReserves(uint256 _newReserveA, uint256 _newReserveB) private {
        reserveA = _newReserveA;
        reserveB = _newReserveB;
    }

    /**
     * @dev Function mints a specified `_amount` of shares to `_to` address,
     * when LP add a liquidity to a pool.
     * @param _to - address of the LP, who receive minted shares.
     * @param _amount - amount to mint.
     */
    function _mintShares(address _to, uint256 _amount) private {
        shareBalance[_to] += _amount;
        totalSharesSupply += _amount;
    }

    /**
     * @dev Function burn a specified `_amount` of shares from `_from` address,
     * when LP remove liquidity from a pool.
     * @param _from - address of the LP, who receive minted shares.
     * @param _amount - amount to mint.
     */
    function _burnShares(address _from, uint256 _amount) private {
        shareBalance[_from] -= _amount;
        totalSharesSupply -= _amount;
    }

    /**
     * @dev Returns LP `uint256` amount of shares.
     */
    function getShares() public view returns (uint256) {
        return shareBalance[msg.sender]; 
    }

    /**
     * @dev Returns a `reserveA` and `reserveB` values.
     */
    function getReserves() public view returns (uint256 _reserveA, uint256 _reserveB) {
        (_reserveA, _reserveB) = (reserveA, reserveB);
    }

    /**
     * @dev Function set up In and Out tokens for a swap. If `_tokenIn` is an `tokenA`,
     * then return a tuple (`tokenIn` = `tokenA`, `tokenOut` = `tokenB`), and vise versa
     * if `_tokenIn` is a `tokenB`.
     * @param _tokenIn - address of the token for sell.
     */
    function _setInOutToken(address _tokenIn) private view returns (
        IERC20 tokenIn, 
        IERC20 tokenOut, 
        uint256 reserveIn,
        uint256 reserveOut
    )
    {
        bool isTokenA = _tokenIn == address(tokenA);
        (tokenIn, tokenOut, reserveIn, reserveOut) = isTokenA
            ? (tokenA, tokenB, reserveA, reserveB)
            : (tokenB, tokenA, reserveB, reserveA);
    }

    /**
     * @dev Helper function. Returns the smallest number between `x` and `y` arguments.
     * @param x - 1st argument.
     * @param y  - 2nd argument
     */
    function _min(uint256 x, uint256 y) private pure returns (uint z) {
        z = x < y ? x : y;
    }

    /**
     * @dev Helper function. Returns square root from provided `y` argument.
     * @param y - uint256 value.
     */
    function _sqrt(uint256 y) private pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
}
