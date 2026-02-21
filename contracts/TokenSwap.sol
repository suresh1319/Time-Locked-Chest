// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenSwap is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    uint256 public rate; // Number of tokens for 1 ETH (e.g., 1000)
    uint256 public sellFeePercentage; // Fee in percent (e.g., 10 for 10%)
    uint256 public minSellAmount = 0; // Minimum tokens to sell

    event TokensPurchased(address indexed buyer, address indexed token, uint256 amountOfETH, uint256 amountOfTokens);
    event TokensSold(address indexed seller, address indexed token, uint256 amountOfTokens, uint256 amountOfETH);
    event RateUpdated(uint256 newRate);
    event FeeUpdated(uint256 newFee);
    event MinSellAmountUpdated(uint256 newMinAmount);

    constructor(address _token, uint256 _rate, uint256 _sellFeePercentage) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        require(_rate > 0, "Rate must be greater than 0");
        require(_sellFeePercentage <= 30, "Fee too high"); // Max 30% fee

        token = IERC20(_token);
        rate = _rate;
        sellFeePercentage = _sellFeePercentage;
    }

    // Buy tokens by sending ETH
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Send ETH to buy tokens");
        
        uint256 tokenAmount = msg.value * rate;
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient liquidity in contract");

        token.safeTransfer(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, address(token), msg.value, tokenAmount);
    }

    // Sell tokens for ETH
    function sellTokens(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount >= minSellAmount, "Amount below minimum sell amount");
        
        uint256 ethAmount = _amount / rate;

        uint256 fee = (ethAmount * sellFeePercentage) / 100;
        uint256 payout = ethAmount - fee;

        require(address(this).balance >= payout, "Insufficient ETH liquidity in contract");

        token.safeTransferFrom(msg.sender, address(this), _amount);
        
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "ETH transfer failed");

        emit TokensSold(msg.sender, address(token), _amount, payout);
    }

    // Allow direct ETH deposits for liquidity funding.
    receive() external payable {}

    // Owner functions to manage liquidity and settings
    function withdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawTokens(uint256 _amount) external onlyOwner {
        token.safeTransfer(owner(), _amount);
    }

    function setRate(uint256 _newRate) external onlyOwner {
        require(_newRate > 0, "Rate must be > 0");
        rate = _newRate;
        emit RateUpdated(_newRate);
    }

    function setSellFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 30, "Fee too high");
        sellFeePercentage = _newFee;
        emit FeeUpdated(_newFee);
    }

    function setMinSellAmount(uint256 _newMin) external onlyOwner {
        minSellAmount = _newMin;
        emit MinSellAmountUpdated(_newMin);
    }
}
