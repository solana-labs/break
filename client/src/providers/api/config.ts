import { Account, clusterApiUrl, PublicKey, Cluster } from "@solana/web3.js";

export interface Config {
  cluster?: Cluster;
  clusterUrl: string;
  programId: PublicKey;
  programAccount: PublicKey;
  programAccountSpace: number;
  payerAccount: Account;
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

export function configFromResponse(response: any): Config {
  return {
    cluster: stringToCluster(response.cluster),
    clusterUrl: response.cluster
      ? clusterApiUrl(response.cluster)
      : response.clusterUrl,
    programId: new PublicKey(response.programId),
    programAccount: new PublicKey(response.programAccount),
    programAccountSpace: response.programAccountSpace,
    accountCapacity: response.accountCapacity,
    payerAccount: new Account(Buffer.from(response.accountKey, "hex"))
  };
}
