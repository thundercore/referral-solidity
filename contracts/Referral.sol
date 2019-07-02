pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Referral is Ownable {
  using SafeMath for uint;

  uint8 constant MAX_REFER_DEPTH = 3;
  uint8 constant MAX_REFEREE_BONUS_LEVEL = 3;

  struct Account {
    address payable referrer;
    uint reward;
    uint referredCount;
    uint lastActiveTimestamp;
  }

  struct RefereeBonusRate {
    uint upperBound;
    uint rate;
  }

  event RegisterReferer(address referee, address referrer);
  event PayReferral(address to, uint amount, uint level);
  // pay event
  // update time event

  mapping(address => Account) accounts;

  uint256[] levelRate;
  uint256 referralBonus;
  uint256 decimals;
  uint256 secondsUntilInactive;
  bool onlyRewardActiveReferrers;
  RefereeBonusRate[] refereeBonusRateMap;

  constructor(
    uint256[] memory _levelRate,
    uint _referralBonus,
    uint _decimals,
    uint _secondsUntilInactive,
    bool _onlyRewardActiveReferrers,
    uint256[] memory _refereeBonusRateMap
  )
    public
  {
    require (_levelRate.length <= MAX_REFER_DEPTH, "Exceeded max referral level depth");
    require(_refereeBonusRateMap.length % 2 == 0, "Referee Bonus Rate Map should be pass as [<amount>, <rate>, ....]");
    require(_refereeBonusRateMap.length / 2 <= MAX_REFEREE_BONUS_LEVEL, "Exceeded max referree bonus level depth");
    require (_referralBonus <= _decimals, "Referral bonus is exceeded 100%");
    require (sum(_levelRate) > _decimals, "Sum of level rate exceeded 100%");

    referralBonus = _referralBonus;
    decimals = _decimals;
    levelRate = _levelRate;
    secondsUntilInactive = _secondsUntilInactive;
    onlyRewardActiveReferrers = _onlyRewardActiveReferrers;

    // Cause we can't pass struct or nested array without enabling experimental ABIEncoderV2, use array to simulate it
    for (uint i; i < _refereeBonusRateMap.length; i += 2) {
      refereeBonusRateMap[i] = RefereeBonusRate(_refereeBonusRateMap[i], _refereeBonusRateMap[i+1]);
    }
  }

  function sum(uint[] memory data) public pure returns (uint) {
    uint S;
    for(uint i;i < data.length;i++) {
      S += data[i];
    }
    return S;
  }

  function hasReferrer(address addr) public view returns(bool){
    return accounts[addr].referrer != address(0);
  }

  function getTime() public view returns(uint256) {
    return now; // solium-disable-line security/no-block-members
  }

  function getRefereeBonusRate(uint256 amount) public view returns(uint256) {
    for(uint i; i < refereeBonusRateMap.length; i++) {
      if (amount >= refereeBonusRateMap[i].upperBound) {
        return refereeBonusRateMap[i].rate;
      }
    }
  }

  function addReferrer(address payable referrer) public {
    require(referrer != address(0), "Referrer cannot be 0x0 address");
    require(accounts[msg.sender].referrer == address(0), "Address have been registered upline");

    Account storage userAccount = accounts[msg.sender];
    Account storage parentAccount = accounts[referrer];

    userAccount.referrer = referrer;
    userAccount.lastActiveTimestamp = getTime();
    parentAccount.referredCount = parentAccount.referredCount.add(1);

    emit RegisterReferer(msg.sender, referrer);
  }

  function payReferral(uint256 value) internal returns(uint256){
    Account memory userAccount = accounts[msg.sender];
    uint totalReferal;

    for (uint i; i < levelRate.length; i++) {
      address payable parent = userAccount.referrer;
      Account storage parentAccount = accounts[userAccount.referrer];

      if(parentAccount.lastActiveTimestamp.add(secondsUntilInactive) >= getTime()) {
        uint c = value.mul(referralBonus).div(decimals)
          .mul(levelRate[i]).div(decimals)
          .mul(getRefereeBonusRate(parentAccount.referredCount)).div(decimals);

        totalReferal = totalReferal.add(c);

        parent.transfer(c);
        emit PayReferral(parent, c, i + 1);
      }

      userAccount = parentAccount;
    }

    accounts[msg.sender].lastActiveTimestamp = getTime();
    return totalReferal;
  }

  function updateActiveTimestamp(address user) internal {
    Account storage userAccount = accounts[user];
    userAccount.lastActiveTimestamp = getTime();
  }

  function setSecondsUntilInactive(uint _secondsUntilInactive) public onlyOwner {
    secondsUntilInactive = _secondsUntilInactive;
  }

  function setOnlyRewardAActiveReferrers(bool _onlyRewardActiveReferrers) public onlyOwner {
    onlyRewardActiveReferrers = _onlyRewardActiveReferrers;
  }
}
