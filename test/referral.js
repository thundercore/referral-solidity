const {
  BN,
  ether,
  balance,
  expectEvent,
  expectRevert,
  constants: helperConstants
} = require("openzeppelin-test-helpers");
const { expect } = require("chai");
const Referral = artifacts.require("ReferralMock");

const { constants, events, errors } = require("./constants");

contract("Referral", function(accounts) {
  const decimals = new BN(10000);
  const referralBonus = new BN(500);
  const secondsUntilInactive = new BN(24 * 60 * 60);
  const onlyRewardActiveReferrers = false;
  const levelRate = [new BN(8000), new BN(2000)];
  // 1ppl: 50%, 2 ppl: 100%
  const refereeBonusRateMap = [new BN(1), new BN(5000), new BN(2), decimals];

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
    });

    it("Should success add referrer", async () => {
      const result = await this.referral.addReferrer(accounts[0], {
        from: accounts[1]
      });

      expectEvent.inLogs(result.logs, events.registeredReferer, {
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

    it("Should failed when add address self as referrer", async () => {
      await expectRevert(
        this.referral.addReferrer(accounts[1], {
          from: accounts[1]
        }),
        errors.InvalidReferrer
      );
    });


    it("Should failed when an address double added as referrer", async () => {
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

  describe("Pay Referral", function() {
    beforeEach(async () => {
      this.referral = await Referral.new(
        levelRate,
        referralBonus,
        decimals,
        secondsUntilInactive,
        onlyRewardActiveReferrers,
        refereeBonusRateMap
      );
    });

    it("Total referral bonus should be right", async () => {
      /**
       * refer seq 0 <- 1 <- 2
       *                 \ _ 3
       * */
      await this.referral.addReferrer(accounts[0], {
        from: accounts[1]
      });

      await this.referral.addReferrer(accounts[1], {
        from: accounts[2]
      });

      await this.referral.addReferrer(accounts[1], {
        from: accounts[3]
      });

      const value = ether("1");
      const amount0 = value
        .mul(referralBonus)
        .div(decimals)
        .mul(levelRate[1])
        .div(decimals)
        .mul(refereeBonusRateMap[1])
        .div(decimals);
      const amount1 = value
        .mul(referralBonus)
        .div(decimals)
        .mul(levelRate[0])
        .div(decimals)
        .mul(refereeBonusRateMap[3])
        .div(decimals);
      const amount = amount0.add(amount1);

      const result = await this.referral.play.call({
        from: accounts[2],
        value
      });

      expect(result).to.be.bignumber.equals(amount);
    });

    it("Total referral would be 0 if no upline", async () => {
      const value = ether("0.01");
      const result = await this.referral.play.call({
        from: accounts[0],
        value
      });

      expect(result).to.be.bignumber.equals(new BN(0));
    });

    it("Pay referral to each level referrer", async () => {
      /**
       * refer seq 0 <- 1 <- 2
       *                 \ _ 3
       * */
      await this.referral.addReferrer(accounts[0], {
        from: accounts[1]
      });

      await this.referral.addReferrer(accounts[1], {
        from: accounts[2]
      });

      await this.referral.addReferrer(accounts[1], {
        from: accounts[3]
      });

      const value = ether("1");
      const amount0 = value
        .mul(referralBonus)
        .div(decimals)
        .mul(levelRate[1])
        .div(decimals)
        .mul(refereeBonusRateMap[1])
        .div(decimals);
      const amount1 = value
        .mul(referralBonus)
        .div(decimals)
        .mul(levelRate[0])
        .div(decimals)
        .mul(refereeBonusRateMap[3])
        .div(decimals);

      const balanceTracker0 = await balance.tracker(accounts[0]);
      const balanceTracker1 = await balance.tracker(accounts[1]);

      const result = await this.referral.play({
        from: accounts[2],
        value
      });

      // check balance
      expect(await balanceTracker0.delta()).to.be.bignumber.equal(amount0);
      expect(await balanceTracker1.delta()).to.be.bignumber.equal(amount1);

      // check event
      expectEvent.inLogs(result.logs, events.paidReferral, {
        from: accounts[2],
        to: accounts[0],
        amount: amount0,
        level: new BN(2)
      });
      expectEvent.inLogs(result.logs, events.paidReferral, {
        from: accounts[2],
        to: accounts[1],
        amount: amount1,
        level: new BN(1)
      });
    });
  });

  describe("Utils", function() {
    beforeEach(async () => {
      this.referral = await Referral.new(
        levelRate,
        referralBonus,
        decimals,
        secondsUntilInactive,
        onlyRewardActiveReferrers,
        refereeBonusRateMap
      );
    });

    it("Check account referrer", async () => {
      await this.referral.addReferrer(accounts[0], {
        from: accounts[1]
      });

      const result0 = await this.referral.hasReferrer.call(accounts[0], {
        from: accounts[0]
      });
      const result1 = await this.referral.hasReferrer.call(accounts[1], {
        from: accounts[0]
      });

      expect(result0).to.equal(false);
      expect(result1).to.equal(true);
    });
  });
});
