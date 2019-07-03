const { BN } = require('openzeppelin-test-helpers');

module.exports = {
  constants: {
    MAX_REFER_DEPTH: new BN(3),
    MAX_REFEREE_BONUS_LEVEL: new BN(3),
  },
  events: {
    registeredReferer: 'RegisteredReferer',
    paidReferral: 'PaidReferral',
    updatedUserLastActiveTime: 'UpdatedUserLastActiveTime'
  },
  errors: {
    MissLevelRate: 'Referral level should be at least one',
    ExceedMaxLevelDepth: 'Exceeded max referral level depth',
    ExceedMaxReferreeLevelDepth: 'Exceeded max referree bonus level depth',
    TotalLevelRateOverflow: 'Total level rate exceeded 100%',
    ReferralRateOverflow: 'Referral bonus is exceeded 100%',
    InvalidReferrer: 'Referrer cannot be 0x0 address',
    DoubleRegisterReferrer: 'Address have been registered upline',
  },
};
