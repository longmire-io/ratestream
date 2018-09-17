pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';


/**
 * @title LmrToken
 * @dev all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract LmrToken is ERC20 {

  string public constant name = "Longmire";
  string public constant symbol = "LMR";
  uint8 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 10000000 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor() public {
    _mint(msg.sender, INITIAL_SUPPLY);
  }

}

