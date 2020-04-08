import fetcher from "@/api/fetcher";
import Path from "@/api/paths";
import { Buffer } from "buffer";
import {
  Account,
  clusterApiUrl,
  AccountChangeCallback,
  PublicKey,
  Cluster,
  Connection
} from "@solana/web3.js";

export class SolanaService {
  _cluster?: Cluster;
  _clusterUrl?: string;
  _connection?: Connection;
  _programId?: PublicKey;
  _programAccount?: PublicKey;
  _payerAccount?: Account;
  _minAccountBalance?: number;
  _signatureFee?: number;
  _accountCapacity = 0;
  _accountSubscriptionId?: number;

  initializing = false;
  remainingCapacity = 0;
  refreshingPayer = false;
  onAccountChange?: AccountChangeCallback;

  get connection(): Connection {
    if (!this._connection) throw new Error("Not initialized");
    return this._connection;
  }

  get programId(): PublicKey {
    if (!this._programId) throw new Error("Not initialized");
    return this._programId;
  }

  get programAccount(): PublicKey {
    if (!this._programAccount) throw new Error("Not initialized");
    return this._programAccount;
  }

  get programAccountSpace(): number {
    if (!this._accountCapacity) throw new Error("Not initialized");
    return Math.ceil(this._accountCapacity / 8);
  }

  get payerAccount(): Account {
    if (!this._payerAccount) throw new Error("Not initialized");
    if (!this.usePayerAccount()) throw new Error("Payer account depleted");
    return this._payerAccount;
  }

  get minAccountBalance(): number {
    if (!this._minAccountBalance) throw new Error("Not initialized");
    return this._minAccountBalance;
  }

  get signatureFee(): number {
    if (!this._signatureFee) throw new Error("Not initialized");
    return this._signatureFee;
  }

  getClusterParam = (): string => {
    if (this._cluster) {
      return `cluster=${this._cluster}`;
    } else if (this._clusterUrl) {
      return `clusterUrl=${this._clusterUrl}`;
    } else {
      throw new Error("Not initialized");
    }
  };

  init = async (onAccountChange: AccountChangeCallback): Promise<void> => {
    if (this.initializing) return;
    this.initializing = true;

    let response;
    let invalidResponse = true;
    while (invalidResponse) {
      try {
        response = await fetcher.get(Path.Init);
        invalidResponse =
          !("programId" in response) ||
          !("programAccount" in response) ||
          !("accountKey" in response) ||
          !("accountCapacity" in response) ||
          !("minAccountBalance" in response) ||
          !("signatureFee" in response) ||
          !("cluster" in response || "clusterUrl" in response);
        if (invalidResponse) {
          throw new Error("Failed server init request");
        }
      } catch (err) {
        this.initializing = false;
        throw err;
      }
    }

    if (!this._connection) {
      const endpoint = response.cluster
        ? clusterApiUrl(response.cluster)
        : response.clusterUrl;
      this._connection = new Connection(endpoint, "recent");
      this._cluster = response.cluster;
      this._clusterUrl = response.clusterUrl;
    } else if (this._accountSubscriptionId) {
      this._connection.removeAccountChangeListener(this._accountSubscriptionId);
    }

    this._programId = new PublicKey(response.programId);
    this._programAccount = new PublicKey(response.programAccount);
    this._accountCapacity = response.accountCapacity;
    this._payerAccount = new Account(Buffer.from(response.accountKey, "hex"));
    this._signatureFee = response.signatureFee;
    this._minAccountBalance = response.minAccountBalance;
    this._accountSubscriptionId = this._connection.onAccountChange(
      this._programAccount,
      onAccountChange
    );
    this.remainingCapacity = this._accountCapacity;
    this.initializing = false;
  };

  initialized = (): boolean => {
    return this._connection !== undefined;
  };

  uninit = () => {
    if (this._connection) {
      if (this._accountSubscriptionId) {
        this.connection.removeAccountChangeListener(
          this._accountSubscriptionId
        );
        this._accountSubscriptionId = undefined;
      }
      this._connection = undefined;
    }
    this._programId = undefined;
  };

  private refreshPayerAccount = async (): Promise<void> => {
    if (this.refreshingPayer) return;
    this.refreshingPayer = true;

    try {
      const response = await fetcher.get(Path.Refresh);
      if (!("accountKey" in response) || !("accountCapacity" in response)) {
        throw new Error("Failed to refresh payer");
      }

      this._accountCapacity = response.accountCapacity;
      this.remainingCapacity = response.accountCapacity;
      this._payerAccount = new Account(Buffer.from(response.accountKey, "hex"));
    } catch (err) {
      console.error(err);
    } finally {
      this.refreshingPayer = false;
    }
  };

  private usePayerAccount = (): boolean => {
    if (this.remainingCapacity === 0) return false;
    this.remainingCapacity--;
    if (this.remainingCapacity <= 50) {
      this.refreshPayerAccount();
    }
    return true;
  };
}
