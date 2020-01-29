// To connect to a public testnet, set `export LIVE=1` in your
// environment. By default, `LIVE=1` will connect to the beta testnet.

import { testnetChannelEndpoint } from "@solana/web3.js";

export const url = process.env.LIVE
  ? testnetChannelEndpoint(process.env.CHANNEL || "beta", false)
  : "http://localhost:8899";

export const urlTls = process.env.LIVE
  ? testnetChannelEndpoint(process.env.CHANNEL || "beta", true)
  : "http://localhost:8899";
