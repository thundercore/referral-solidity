# Referral Solidity
[![NPM Package](https://img.shields.io/npm/v/@thundercore/referral-solidity.svg?style=flat-square)](https://www.npmjs.org/package/@thundercore/referral-solidity)
[![CircleCI](https://img.shields.io/circleci/build/github/thundercore/referral-solidity.svg)](https://circleci.com/gh/thundercore/referral-solidity/tree/master)
[![Discord](https://img.shields.io/discord/467102816230440970.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/5EbxXfw)

Referral Solidity is a library for quick building multiple levels referral mechanisms in your dapps.

## Get Started

### Install

```bash
npm install @thundercore/referral-solidity
```

### Usage
To write your custom contracts, import ours and extend them through inheritance.


```solidity
pragma solidity ^0.5.0;
import 'referral-solidity/contracts/Referral.sol';

contracts YourGame is Referral {
  constructor() Referral ([6000, 3000, 1000], 500, 10000, 24 * 60 * 60, true, [1, 10000]) public {
  }
}

```

## Contributing
