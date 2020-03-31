// To connect to a public testnet, set `export LIVE=1` in your
// environment. By default, `LIVE=1` will connect to the stable testnet.

import { clusterApiUrl, Cluster } from "@solana/web3.js";

function chooseCluster(): Cluster {
  switch (process.env.CLUSTER) {
    case "devnet":
    case "testnet":
    case "mainnet-beta": {
      return process.env.CLUSTER;
    }
  }

  return "devnet";
}

export const url =
  process.env.RPC_URL ||
  (process.env.LIVE
    ? clusterApiUrl(chooseCluster(), false)
    : "http://localhost:8899");

export const urlTls =
  process.env.RPC_URL ||
  (process.env.LIVE
    ? clusterApiUrl(chooseCluster(), true)
    : "http://localhost:8899");
