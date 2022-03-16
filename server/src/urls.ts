// To connect to a public cluster, set `export LIVE=1` in your
// environment. By default, `LIVE=1` will connect to the devnet cluster.

import { clusterApiUrl, Cluster } from "@solana/web3.js";

function chooseCluster(): Cluster | undefined {
  if (!process.env.LIVE) return;
  switch (process.env.CLUSTER) {
    case "devnet":
    case "testnet":
    case "mainnet-beta": {
      return process.env.CLUSTER;
    }
  }
  return "devnet";
}

function getApiUrl(cluster: string | undefined, tls: boolean) {
  const prefix = tls ? "https://" : "http://";
  switch (cluster) {
    case "mainnet-beta":
      return `${prefix}api.internal.mainnet-beta.solana.com`;
    case "testnet":
      return `${prefix}api.internal.testnet.solana.com`;
  }
  return `${prefix}api.internal.devnet.solana.com`;
}

export const cluster = chooseCluster();

export const url =
  process.env.RPC_URL ||
  (process.env.LIVE ? getApiUrl(cluster, false) : "http://localhost:8899");

export const urlTls =
  process.env.RPC_URL ||
  (process.env.LIVE ? getApiUrl(cluster, true) : "http://localhost:8899");
