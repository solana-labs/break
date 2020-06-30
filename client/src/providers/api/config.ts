import {
  Account,
  clusterApiUrl,
  PublicKey,
  Cluster,
  Connection,
} from "@solana/web3.js";

export interface Config {
  cluster: Cluster | undefined;
  clusterUrl: string;
  connection: Connection;
  programId: PublicKey;
  gameCost: number;
  paymentRequired: boolean;
}

export interface AccountsConfig {
  programAccounts: PublicKey[];
  feeAccounts: Account[];
  accountCapacity: number;
}

function stringToCluster(str: string | undefined): Cluster | undefined {
  switch (str) {
    case "devnet":
    case "testnet":
    case "mainnet-beta": {
      return str;
    }
    default:
      return undefined;
  }
}

export function configFromInit(response: any): Config {
  const cluster = stringToCluster(response.cluster);
  const clusterUrl = response.cluster
    ? clusterApiUrl(response.cluster)
    : response.clusterUrl;
  return {
    cluster,
    clusterUrl,
    connection: new Connection(clusterUrl),
    programId: new PublicKey(response.programId),
    // Add 1 lamport because if the account is left with 0 lamports,
    // we won't get a notification for it
    gameCost: response.gameCost + 1,
    paymentRequired: response.paymentRequired,
  };
}

export function configFromAccounts(response: any): AccountsConfig {
  return {
    programAccounts: response.programAccounts.map(
      (account: string) => new PublicKey(account)
    ),
    accountCapacity: response.accountCapacity,
    feeAccounts: response.feeAccounts.map(
      (key: string) => new Account(Buffer.from(key, "base64"))
    ),
  };
}
