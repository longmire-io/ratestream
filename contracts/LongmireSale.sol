  
pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol';

contract LongmireSale is Crowdsale {
  uint256 _rate; // rates: 400 for $0.50/token, 800 for $1.00 etc.
  constructor(uint256 rate, address wallet, IERC20 token) Crowdsale(rate, wallet, token) public {
    _rate = rate;
      
  }
    
}



