const bigInt = require("big-integer");
const Referral = artifacts.require("Referral");

module.exports = function(deployer) {
  const decimals = 10000;
  const referralBonus = 500;
  const secondsUntilInactive = 24 * 60 * 60;
  const onlyRewardActiveReferrers = false;
  const levelRate = [8000, 2000];
  const refereeBonusRateMap = [1, decimals];

  deployer.deploy(Referral, levelRate, referralBonus, decimals, secondsUntilInactive, onlyRewardActiveReferrers, refereeBonusRateMap);
};
