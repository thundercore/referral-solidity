const { BN } = require('openzeppelin-test-helpers');

module.exports = {
  constants: {
    MAX_REFER_DEPTH: new BN(3),
    MAX_REFEREE_BONUS_LEVEL: new BN(3),
  },
  events: {
    registeredReferer: 'RegisteredReferer',
    registeredRefererFailed: 'RegisteredRefererFailed',
    paidReferral: 'PaidReferral',
    updatedUserLastActiveTime: 'UpdatedUserLastActiveTime'
  },
  errors: {
    MissLevelRate: 'Referral level should be at least one',
    ExceedMaxLevelDepth: 'Exceeded max referral level depth',
    ExceedMaxReferreeLevelDepth: 'Exceeded max referree bonus level depth',
    TotalLevelRateOverflow: 'Total level rate exceeds 100%',
    ReferralRateOverflow: 'Referral bonus exceeds 100%',
    RefereeRateOverflow: 'One of referee bonus rate exceeds 100%',
    Invalid0x0Referrer: 'Referrer cannot be 0x0 address',
    InvalidReferrer: 'Referee cannot be one of referrer uplines',
    DoubleRegisterReferrer: 'Address have been registered upline',
  },
};
