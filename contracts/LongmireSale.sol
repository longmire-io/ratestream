
pragma solidity ^0.4.19;

import 'openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';

contract LongmireSale is Crowdsale, CappedCrowdsale {
  uint256 _rate; // rates: 400 for $0.50/token, 800 for $1.00 etc.
  constructor(uint256 rate, uint256 cap, address wallet, IERC20 token)
  Crowdsale(rate, wallet, token)
  CappedCrowdsale(cap * (10 ** uint256(18))) // cap in wei, for $100k=>450 eth
  public {
    _rate = rate;
  }

}
