const {
  BN,
  ether,
  expectEvent,
  expectRevert,
  constants: helperConstants
} = require("openzeppelin-test-helpers");
const { expect } = require("chai");
const Referral = artifacts.require("ReferralWithFakeTimeAndPayable");

const { constants, events, errors } = require("./constants");

contract("Referral", function(accounts) {
  const decimals = new BN(10000);
  const referralBonus = new BN(500);
  const secondsUntilInactive = new BN(24 * 60 * 60);
  const onlyRewardActiveReferrers = false;
  const levelRate = [new BN(8000), new BN(2000)];
  const refereeBonusRateMap = [new BN(1), decimals];

  describe("Init", function() {
    it("Should failed to deploy when levels is empty", async () => {
      await expectRevert(
        Referral.new(
          [],
          referralBonus,
          decimals,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          refereeBonusRateMap
        ),
        errors.MissLevelRate
      );
    });

    it("Should failed to deploy when levels are too much", async () => {
      await expectRevert(
        Referral.new(
          [new BN(4000), new BN(3000), new BN(2000), new BN(1000)],
          referralBonus,
          decimals,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          refereeBonusRateMap
        ),
        errors.ExceedMaxLevelDepth
      );
    });

    it("Should failed when total level rate is larger than 100%", async () => {
      await expectRevert(
        Referral.new(
          [new BN(4000), new BN(4000), new BN(4000)],
          referralBonus,
          decimals,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          refereeBonusRateMap
        ),
        errors.TotalLevelRateOverflow
      );
    });

    it("Should failed when Referral bonus is larger than 100%", async () => {
      await expectRevert(
        Referral.new(
          levelRate,
          decimals.mul(new BN(2)),
          decimals,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          refereeBonusRateMap
        ),
        errors.ReferralRateOverflow
      );
    });
  });

  describe("Add Referrer", function() {
    beforeEach(async () => {
      this.referral = await Referral.new(
        levelRate,
        referralBonus,
        decimals,
        secondsUntilInactive,
        onlyRewardActiveReferrers,
        refereeBonusRateMap
      );
    })

    it("Should success add referrer", async () => {
      const result = await this.referral.addReferrer(accounts[0], {
        from: accounts[1]
      });


      expectEvent.inLogs(result.logs, events.registerReferer, {
        referee: accounts[1],
        referrer: accounts[0]
      });
    });

    it("Should failed when add address 0x0 as referrer", async () => {
      await expectRevert(
        this.referral.addReferrer(helperConstants.ZERO_ADDRESS, {
          from: accounts[1]
        }),
        errors.InvalidReferrer
      );
    });

    it("Should failed when an address double add referrer", async () => {
      await this.referral.addReferrer(accounts[0], {
        from: accounts[1]
      });

      await expectRevert(
        this.referral.addReferrer(accounts[2], {
          from: accounts[1]
        }),
        errors.DoubleRegisterReferrer
      );
    });
  });

  // describe("Pay Referral", function() {
  //   beforeEach(async () => {
  //     this.referral = await Referral.new(
  //       levelRate,
  //       referralBonus,
  //       decimals,
  //       secondsUntilInactive,
  //       onlyRewardActiveReferrers,
  //       refereeBonusRateMap
  //     );
  //   })

  //   it("Update", async () => {
  //     await this.referral.addReferrer(accounts[0], {
  //       from: accounts[1]
  //     });

  //     await this.referral.payReferral()
  //   });
  // });
});
