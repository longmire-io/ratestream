pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
//import './TokenVesting.sol';

contract LmrToken is StandardToken {


  string public name = 'Longmire';
  string public symbol = 'LMR';
  uint8 public decimals = 18;
  uint public INITIAL_SUPPLY = 10000000;

  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
  }

//TokenVesting (0x9f943ed85fb1b63b2a68af79290e5023d32f5e96, 15, 30, 40, false);

}

