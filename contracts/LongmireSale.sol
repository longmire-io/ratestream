  
pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol';

contract LongmireSale is Crowdsale {
  constructor(uint256 rate, address wallet, IERC20 token) Crowdsale(rate, wallet, token) public {
  }
}



