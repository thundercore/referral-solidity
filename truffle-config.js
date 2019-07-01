/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 */

const HDWalletProvider = require("truffle-hdwallet-provider");
const fs = require("fs");

const TESTNET_PROVIDER = "https://testnet-rpc.thundercore.com";
const MAINNET_PROVIDER = "https://mainnet-rpc.thundercore.com";

let privateKeys = null;
let mnemonic = null;
try {
  privateKeys = fs
    .readFileSync(".private-keys", { encoding: "ascii" })
    .split("\n")
    .filter(x => x.length > 0);
} catch (err) {
  if (err.code !== "ENOENT") {
    throw err;
  }
}

if (!privateKeys) {
  try {
    mnemonic = fs.readFileSync(".mnemonic", { encoding: "ascii" }).trim();
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
}

module.exports = {
  networks: {
    // For `truffle develop`
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 9545, // Standard Ethereum port (default: none)
      network_id: "*" // Any network (default: none)
    },
    "thunder-testnet": {
      provider: () => {
        if (privateKeys === null && mnemonic === null) {
          throw new Error("Please create a .private-keys or .mnemonic file");
        }

        return privateKeys
          ? new HDWalletProvider(
              privateKeys,
              TESTNET_PROVIDER,
              0, // <- change address_index if you want to default to an address other than the first one
              privateKeys.length
            )
          : new HDWalletProvider(
              mnemonic,
              TESTNET_PROVIDER,
              0 // <- change address_index if you want to use an address other than the first one
            );
      },
      network_id: "18"
    },
    "thunder-mainnet": {
      provider: () => {
        if (privateKeys === null && mnemonic === null) {
          throw new Error("Please create a .private-keys or .mnemonic file");
        }

        return privateKeys
          ? new HDWalletProvider(
              privateKeys,
              MAINNET_PROVIDER,
              0, // <- change address_index if you want to use non-first address
              privateKeys.length
            )
          : new HDWalletProvider(
              mnemonic,
              MAINNET_PROVIDER,
              0 // <- change address_index if you want to use non-first address
            );
      },
      network_id: "108"
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.9", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // see the solidity docs for advice about optimization and evmversion
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "byzantium" // Current evm on ThunderCore fixed at "byzantium"
      }
    }
  }
};
