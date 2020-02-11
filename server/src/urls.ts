// To connect to a public testnet, set `export LIVE=1` in your
// environment. By default, `LIVE=1` will connect to the stable testnet.

import { testnetChannelEndpoint } from "@solana/web3.js";

export const url =
  process.env.RPC_URL ||
  (process.env.LIVE
    ? testnetChannelEndpoint(process.env.CHANNEL || "stable", false)
    : "http://localhost:8899");

export const urlTls =
  process.env.RPC_URL ||
  (process.env.LIVE
    ? testnetChannelEndpoint(process.env.CHANNEL || "stable", true)
    : "http://localhost:8899");
