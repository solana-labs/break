import { Account, clusterApiUrl, PublicKey, Cluster } from "@solana/web3.js";

export interface Config {
  cluster?: Cluster;
  clusterUrl: string;
  programId: PublicKey;
}

export interface AccountsConfig {
  programDataAccounts: PublicKey[];
  programDataAccountSpace: number;
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
  return {
    cluster: stringToCluster(response.cluster),
    clusterUrl: response.cluster
      ? clusterApiUrl(response.cluster)
      : response.clusterUrl,
    programId: new PublicKey(response.programId),
  };
}

export function configFromAccounts(response: any): AccountsConfig {
  return {
    programDataAccounts: response.programDataAccounts.map(
      (account: string) => new PublicKey(account)
    ),
    programDataAccountSpace: response.programDataAccountSpace,
    accountCapacity: response.accountCapacity,
    feeAccounts: response.accountKeys.map(
      (key: string) => new Account(Buffer.from(key, "base64"))
    ),
  };
}
