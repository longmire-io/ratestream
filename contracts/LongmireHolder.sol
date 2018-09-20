pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/TokenTimelock.sol';

contract LongmireHolder is TokenTimelock {
  constructor(
    IERC20 token,
    address beneficiary,
    uint256 releaseTime
  ) 
  TokenTimelock(token, beneficiary, releaseTime) public {

  }
}

