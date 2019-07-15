# Referral Solidity
[![NPM Package](https://img.shields.io/npm/v/@thundercore/referral-solidity.svg?style=flat-square)](https://www.npmjs.org/package/@thundercore/referral-solidity)
[![CircleCI](https://img.shields.io/circleci/build/github/thundercore/referral-solidity.svg)](https://circleci.com/gh/thundercore/referral-solidity/tree/master)
[![Discord](https://img.shields.io/discord/467102816230440970.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/5EbxXfw)

Referral Solidity is a library for quick building multiple levels referral mechanisms in your dapps.  
The current version supports: 

- pay native token (ETH, TT...)
- multiple levels referral (3 as Max now)
- pay referral bonus based referee amount
- only active user get referral bonus
- pay instantly when downline joins

There is tutorial and example at [here](https://developers.thundercore.com/docs/referral-contract).

## Get Started

### Install

```bash
npm install @thundercore/referral-solidity
```

### Usage
To write your custom contracts, import ours lib and extend them through inheritance. Initialize your referral contract by passing the following parameters: `decimals`, `referralBonus`, `secondsUntilInactive`, `onlyRewardActiveReferrers`, `levelRate`, `refereeBonusRateMap`. See the [API](#api) part to know more detail. Then, use `addReferrer` and `payReferral` to binding uplines and trigger referral payment. 

```solidity
pragma solidity ^0.5.0;
import '@thundercore/referral-solidity/contracts/Referral.sol';

contracts YourGame is Referral {
  // Referral(decimals, referralBonus, secondsUntilInactive, onlyRewardActiveReferrers, levelRate, refereeBonusRateMap)
  constructor() Referral (10000, 500, 1 days, true, [6000, 3000, 1000], [1, 10000]) public {
  }

  // bind uplineAddr as msg.sender's referrer
  function addUpline(address payable uplineAddr) public {
    addReferrer(upline);
  }

  // trigger pay referral in your business logic
  function play() public payable {
    payReferral(msg.value);
  }
}
```

### Bonus Formula
The referral bonus formula is:

![definition](https://latex.codecogs.com/gif.latex?A:\text{Transaction&space;Amount}&space;,X:&space;\text{Referral&space;Bonus&space;Rate}&space;,Y_{n}:&space;\text{n&space;depth&space;Bonus&space;Rate&space;which}&space;Y_{1}&plus;...&plus;Y_{n}&space;=&space;1,&space;Z_{m}:&space;\text{Referral&space;rate&space;of&space;m&space;referee},&space;isActive:&space;\text{default&space;0,&space;1&space;when&space;user&space;should&space;be&space;active&space;in&space;T&space;time})

![\large R = A \times X \times Y_{n} \times Z_{m} \times isActive](https://latex.codecogs.com/gif.latex?\large&space;R&space;=&space;A&space;\times&space;X&space;\times&space;Y_{n}&space;\times&space;Z_{m}&space;\times&space;isActive)

For the specific example, you can see the [example](#Example).

### API

#### Constructor Parameters 

##### decimals `<uint>`
Base decimals for all rate calculation in referral. 
For example, if `decimals` equals to `10000`, and `referralBonus` is `500`, that means referral bonus rate is `5%`.

##### referralBonus `<uint>`
The total referral bonus rate, which will divide by `decimals`. For example, If you will like to set as `5%`, it can set as `50` when `decimals` is `1000`.

##### secondsUntilInactive `<uint>`
The seconds that how long a user will be inactive. For example, `one days`. 

##### onlyRewardActiveReferrers `<bool>`
The flag to enable whether paying to inactive uplines.

##### levelRate `<uint[]>`
The bonus rate for each level, which will divide by decimals too. The max level depth is 3. For example, set `levelRate` as `[6000, 3000, 1000]` when `decimals` is `10000` for the following case:

|               | level1        | level2        | level3        |
| ------------- | ------------- | ------------- | ------------- |
|  Rate         | 60%           | 30%           | 10%           |


##### refereeBonusRateMap `<uint[]>`
The bonus rate mapping to each referree amount, which will divide by decimals too. The max depth is 3.
The map should be pass as [ `<lower amount>`, `<rate>`, ... ]. For example, you should pass `[1, 2500, 5, 5000, 10, 10000]` when decimals is `10000` for the following case:

|               | 1 - 4         | 5 - 9         | 10+           |
| ------------- | ------------- | ------------- | ------------- |
|  Rate         | 25%           | 50%           | 100%          |


#### Methods

##### addReferrer(address payable referrer) -> bool
Add an address as `msg.sender`'s referrer. When add referrer failed, it won\'t revert the transaction but emit `RegisteredRefererFailed` events and return false.

##### payReferral((uint256 value) -> uint256
Calculate and pay referral to all of uplines instantly. The return is total tokens paid to uplines.

##### hasReferrer(address addr) -> bool
Check whether an address has the referrer

##### updateActiveTimestamp(address user) -> void
Update an user's active time.

##### setSecondsUntilInactive(uint _secondsUntilInactive) -> void, `onlyOwner`
Update `secondsUntilInactive` after deployed.

##### setOnlyRewardAActiveReferrers(bool _onlyRewardActiveReferrers) -> void, `onlyOwner`
Update `onlyRewardActiveReferrers` after deployed.
  
#### Events 

##### RegisteredReferer(address referee, address referrer)
Emitted when `referee` add `referrer` as upline.

##### RegisteredRefererFailed(address referee, address referrer, string reason)
Emitted when `referee` add `referrer` as upline failed.


##### PaidReferral(address from, address to, uint amount, uint level)
Emitted when `from` trigger pay referral `amount` to `to`, which is `level` level referrer.

##### UpdatedUserLastActiveTime(address user, uint timestamp)
Emitted when updated `user` active time as `timestamp`. 

#### Property

##### accounts `mapping(address => Account)`
The mapping of all address information. 

```solidity
struct Account {
  address payable referrer; 
  uint reward; // total reward the user got
  uint referredCount; // total amount that the user referred
  uint lastActiveTimestamp; // last active time
}
```

## Example

Consider that we pass the following parameter to referral contract: 

|     Parameter               |      Value                   |
| --------------------------- | ---------------------------- |
| `decimals`                  | `1000`                       |
| `referralBonus`             | `30`                         |
| `secondsUntilInactive`      | `one days`                   |
| `onlyRewardActiveReferrers` | `true`                       |
| `levelRate`                 | `[600, 300, 100]`            |
| `refereeBonusRateMap`       | `[1, 500, 5, 750, 25, 1000]` |

So the rates are 

#### Referral Bonus
3% 

#### level rate

|               | level1        | level2        | level3        |
| ------------- | ------------- | ------------- | ------------- |
|  Rate         | 60%           | 30%           | 10%           |

#### referee bonus rate

|               | 1 - 4         | 5 - 24        | 25+           |
| ------------- | ------------- | ------------- | ------------- |
|  Rate         | 50%           | 75%           | 100%          |


### case

Ther referral relationship is `A <- B <- C <- D` and each case is the following:

|                  |      A        | B             | C             |
| ---------------- | ------------- | ------------- | ------------- |
| referee amount   | 25            | 6             | 1             |
| level from D     | 3             | 2             | 1             |
| last active time | 2019-01-01 00:00 | 2019-01-01 08:00 | 2019-01-01 10:00 |

The following table will showe that if user D play with 1 ETH or TT at `2019-01-01 12:00` and `2019-01-02 6:00`, how much will user A, B and C get.

|                      |      A         | B             | C             |
| -------------------- | -------------- | ------------- | ------------- |
| referee amount rate  |  100%          | 75%           | 50%           |
| Level Rate           | 10%            | 30%           | 60%           |
| Total Referal at `2019-01-01 12:00` | 1 * 3% * 100% * 10% | 1 * 3% * 75% * 30% | 1 * 3% * 50% * 60% |
| Total Referal at `2019-01-02 6:00` | 0 (A inactive at this time) | 1 * 3% * 75% * 30% | 1 * 3% * 50% * 60% |


## Contributing
We are welcome for your participate and help. Please feel free to contribute and check out the [contribution guide]( CONTRIBUTING.md)!
