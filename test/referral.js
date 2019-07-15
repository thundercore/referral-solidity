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

const { constants, events, errors } = require("./utils/constants");
require("./utils/Date");

contract("Referral", function(accounts) {
  const DEFAULT_START_TIME = "2019-01-01 00:00";

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
          decimals,
          referralBonus,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          [],
          refereeBonusRateMap
        ),
        errors.MissLevelRate
      );
    });

    it("Should failed to deploy when levels are too much", async () => {
      await expectRevert(
        Referral.new(
          decimals,
          referralBonus,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          [new BN(4000), new BN(3000), new BN(2000), new BN(1000)],
          refereeBonusRateMap
        ),
        errors.ExceedMaxLevelDepth
      );
    });

    it("Should failed when total level rate is larger than 100%", async () => {
      await expectRevert(
        Referral.new(
          decimals,
          referralBonus,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          [new BN(4000), new BN(4000), new BN(4000)],
          refereeBonusRateMap
        ),
        errors.TotalLevelRateOverflow
      );
    });

    it("Should failed when referral bonus is larger than 100%", async () => {
      await expectRevert(
        Referral.new(
          decimals,
          decimals.mul(new BN(2)),
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          levelRate,
          refereeBonusRateMap
        ),
        errors.ReferralRateOverflow
      );
    });

    it("Should failed when total referee rate is larger than 100%", async () => {
      await expectRevert(
        Referral.new(
          decimals,
          referralBonus,
          secondsUntilInactive,
          onlyRewardActiveReferrers,
          levelRate,
          [new BN(1), decimals.mul(new BN(2))]
        ),
        errors.RefereeRateOverflow
      );
    });
  });

  describe("Add Referrer", function() {
    beforeEach(async () => {
      this.referral = await Referral.new(
        decimals,
        referralBonus,
        secondsUntilInactive,
        onlyRewardActiveReferrers,
        levelRate,
        refereeBonusRateMap
      );
    });

    it("Should success add referrer", async () => {
      const call = await this.referral.addUpline.call(accounts[0], {
        from: accounts[1]
      });

      expect(call).to.be.true;

      const result = await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      expectEvent.inLogs(result.logs, events.registeredReferer, {
        referee: accounts[1],
        referrer: accounts[0]
      });

      const account1 = await this.referral.accounts.call(accounts[1]);
      expect(account1.referrer).to.be.equal(accounts[0]);
    });

    it("Should failed when add address 0x0 as referrer", async () => {
      const call = await this.referral.addUpline.call(
        helperConstants.ZERO_ADDRESS,
        {
          from: accounts[1]
        }
      );

      expect(call).to.be.false;

      const result = await this.referral.addUpline(
        helperConstants.ZERO_ADDRESS,
        {
          from: accounts[1]
        }
      );

      expectEvent.inLogs(result.logs, events.registeredRefererFailed, {
        referee: accounts[1],
        referrer: helperConstants.ZERO_ADDRESS,
        reason: errors.Invalid0x0Referrer
      });

      const account1 = await this.referral.accounts.call(accounts[1]);
      expect(account1.referrer).to.be.equal(helperConstants.ZERO_ADDRESS);
    });

    it("Should failed when add address self as referrer", async () => {
      const call = await this.referral.addUpline.call(accounts[0], {
        from: accounts[0]
      });

      expect(call).to.be.false;

      const result = await this.referral.addUpline(accounts[0], {
        from: accounts[0]
      });

      expectEvent.inLogs(result.logs, events.registeredRefererFailed, {
        referee: accounts[0],
        referrer: accounts[0],
        reason: errors.InvalidReferrer
      });

      const account0 = await this.referral.accounts.call(accounts[0]);
      expect(account0.referrer).to.be.equal(helperConstants.ZERO_ADDRESS);
    });

    it("Should failed when circular referrence", async () => {
      await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      const call = await this.referral.addUpline.call(accounts[1], {
        from: accounts[0]
      });

      expect(call).to.be.false;

      const result = await this.referral.addUpline(accounts[1], {
        from: accounts[0]
      });

      expectEvent.inLogs(result.logs, events.registeredRefererFailed, {
        referee: accounts[0],
        referrer: accounts[1],
        reason: errors.InvalidReferrer
      });

      const account0 = await this.referral.accounts.call(accounts[0]);
      expect(account0.referrer).to.be.equal(helperConstants.ZERO_ADDRESS);
    });

    it("Should failed when an address double added as referrer", async () => {
      await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      const call = await this.referral.addUpline.call(accounts[2], {
        from: accounts[1]
      });

      expect(call).to.be.false;

      const result = await this.referral.addUpline(accounts[2], {
        from: accounts[1]
      });

      expectEvent.inLogs(result.logs, events.registeredRefererFailed, {
        referee: accounts[1],
        referrer: accounts[2],
        reason: errors.DoubleRegisterReferrer
      });

      const account1 = await this.referral.accounts.call(accounts[1]);
      expect(account1.referrer).to.be.equal(accounts[0]);
    });
  });

  describe("Pay Referral", function() {
    beforeEach(async () => {
      this.referral = await Referral.new(
        decimals,
        referralBonus,
        secondsUntilInactive,
        onlyRewardActiveReferrers,
        levelRate,
        refereeBonusRateMap
      );
    });

    it("Total referral bonus should be right", async () => {
      /**
       * refer seq 0 <- 1 <- 2
       *                 \ _ 3
       * */
      await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      await this.referral.addUpline(accounts[1], {
        from: accounts[2]
      });

      await this.referral.addUpline(accounts[1], {
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
      await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      await this.referral.addUpline(accounts[1], {
        from: accounts[2]
      });

      await this.referral.addUpline(accounts[1], {
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

      // check state
      const account0 = await this.referral.accounts.call(accounts[0]);
      const account1 = await this.referral.accounts.call(accounts[1]);
      expect(account0.reward).to.be.bignumber.equal(amount0);
      expect(account1.reward).to.be.bignumber.equal(amount1);

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

  describe("Referral with active user mechanism", function() {
    beforeEach(async () => {
      this.date = new Date(DEFAULT_START_TIME);

      this.referral = await Referral.new(
        decimals,
        referralBonus,
        secondsUntilInactive,
        true,
        levelRate,
        refereeBonusRateMap
      );

      await this.referral.setTime(this.date.getTimeAsSeconds());
    });

    it("No pay when referrer is never active.", async () => {
      await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      const value = ether("0.01");
      const result = await this.referral.play.call({
        from: accounts[1],
        value
      });

      expect(result).to.be.bignumber.equals(new BN(0));
    });

    it("No pay when referrer is inactive", async () => {
      await this.referral.updateUserActiveTime(accounts[0]);

      await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      await this.referral.setTime(this.date.addDays(2).getTimeAsSeconds());

      const value = ether("0.01");
      const result = await this.referral.play.call({
        from: accounts[1],
        value
      });

      expect(result).to.be.bignumber.equals(new BN(0));
    });

    it("Only active users can get referrer", async () => {
      /**
       * refer seq 0 <---- 1 <---- 2
       *           ^       ^
       *        outdated  dated
       * */

      await this.referral.addUpline(accounts[0], {
        from: accounts[1]
      });

      await this.referral.addUpline(accounts[1], {
        from: accounts[2]
      });

      await this.referral.updateUserActiveTime(accounts[0]);

      await this.referral.setTime(this.date.addDays(2).getTimeAsSeconds());

      await this.referral.updateUserActiveTime(accounts[1]);

      const value = ether("1");
      const amount0 = new BN(0);
      const amount1 = value
        .mul(referralBonus)
        .div(decimals)
        .mul(levelRate[0])
        .div(decimals)
        .mul(refereeBonusRateMap[1])
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

      // check state
      const account0 = await this.referral.accounts.call(accounts[0]);
      const account1 = await this.referral.accounts.call(accounts[1]);
      expect(account0.reward).to.be.bignumber.equal(amount0);
      expect(account1.reward).to.be.bignumber.equal(amount1);

      // check event
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
        decimals,
        referralBonus,
        secondsUntilInactive,
        onlyRewardActiveReferrers,
        levelRate,
        refereeBonusRateMap
      );
    });

    it("Check account referrer", async () => {
      await this.referral.addUpline(accounts[0], {
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
