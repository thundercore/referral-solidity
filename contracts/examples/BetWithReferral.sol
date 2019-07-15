pragma solidity ^0.5.0;

import "../Referral.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract DoubleOrNothing is Ownable, Referral {
  event BetSettled(address player, uint256 winnings);

  constructor(
    uint _decimals,
    uint _referralBonus,
    uint _secondsUntilInactive,
    bool _onlyRewardActiveReferrers,
    uint256[] memory _levelRate,
    uint256[] memory _refereeBonusRateMap
  ) Referral(
      _decimals,
      _referralBonus,
      _secondsUntilInactive,
      _onlyRewardActiveReferrers,
      _levelRate,
      _refereeBonusRateMap
  )
  public
  // solium-disable-next-line no-empty-blocks
  {}

  function() external payable {}

  function bet(address payable _referrer) external payable {
    if(!hasReferrer(msg.sender)) {
      addReferrer(_referrer);
    }
    bet();
  }

  function bet() public payable {
    // msg.value is added to the balance to begin with so you need to double it
    require(msg.value * 2 <= address(this).balance, "Balance too low!");
    uint256 winnings = 0;

    // DO NOT USE THIS IN PRODUCTION, IT IS INSECURE
    if(uint256(blockhash(block.number - 1)) % 2 == 0) {
      // 3% is deducted to cover the referral bonus
      winnings = msg.value * 197/100;
      address(msg.sender).transfer(winnings);
    }
    payReferral(msg.value);
    emit BetSettled(msg.sender, winnings);
  }

  function withdraw(uint256 _amount) external onlyOwner {
    require(_amount <= address(this).balance, "Balance too low!");
    address(msg.sender).transfer(_amount);
  }
}
