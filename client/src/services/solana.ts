import fetcher from "@/api/fetcher";
import Path from "@/api/paths";
import { Buffer } from "buffer";
import {
  Account,
  ProgramAccountChangeCallback,
  PublicKey,
  Connection
} from "@solana/web3.js";

export class SolanaService {
  _rpcUrl?: string;
  _connection?: Connection;
  _programId?: PublicKey;
  _payerAccount?: Account;
  _minAccountBalance?: number;
  _creationFee?: number;
  _remainingCapacity = 0;

  initializing = false;
  refreshingPayer = false;
  onProgramAccountChange?: ProgramAccountChangeCallback;
  programSubscriptionId?: number;

  get rpcUrl(): string {
    if (!this._rpcUrl) throw new Error("Not initialized");
    return this._rpcUrl;
  }

  get connection(): Connection {
    if (!this._connection) throw new Error("Not initialized");
    return this._connection;
  }

  get programId(): PublicKey {
    if (!this._programId) throw new Error("Not initialized");
    return this._programId;
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

  get creationFee(): number {
    if (!this._creationFee) throw new Error("Not initialized");
    return this._creationFee;
  }

  init = async (
    onProgramAccountChange: ProgramAccountChangeCallback
  ): Promise<void> => {
    if (this.initializing) return;
    this.initializing = true;

    let response;
    let invalidResponse = true;
    while (invalidResponse) {
      try {
        response = await fetcher.get(Path.Init);
        invalidResponse =
          !("programId" in response) ||
          !("accountKey" in response) ||
          !("accountCapacity" in response) ||
          !("minAccountBalance" in response) ||
          !("creationFee" in response) ||
          !("rpcUrl" in response);
        if (invalidResponse) {
          throw new Error("Failed server init request");
        }
      } catch (err) {
        this.initializing = false;
        throw err;
      }
    }

    if (!this._connection) {
      this._rpcUrl = response.rpcUrl;
      this._connection = new Connection(response.rpcUrl, "recent");
    }

    const newProgramId = new PublicKey(response.programId);
    this.updateProgramId(
      newProgramId,
      this._connection,
      onProgramAccountChange
    );

    this._remainingCapacity = response.accountCapacity;
    this._payerAccount = new Account(Buffer.from(response.accountKey, "hex"));
    this._creationFee = response.creationFee;
    this._minAccountBalance = response.minAccountBalance;
    this.initializing = false;
  };

  initialized = (): boolean => {
    return this._connection !== undefined;
  };

  uninit = () => {
    if (this._connection) {
      if (this.programSubscriptionId) {
        this.connection.removeProgramAccountChangeListener(
          this.programSubscriptionId
        );
        this.programSubscriptionId = undefined;
      }
      this._connection = undefined;
    }
    this._programId = undefined;
  };

  private refreshPayerAccount = async (): Promise<void> => {
    if (this.refreshingPayer) return;
    this.refreshingPayer = true;

    try {
      const response = await fetcher.get(Path.Init);
      if (!("accountKey" in response) || !("accountCapacity" in response)) {
        throw new Error("Failed to refresh payer");
      }

      this._remainingCapacity = response.accountCapacity;
      this._payerAccount = new Account(Buffer.from(response.accountKey, "hex"));
    } catch (err) {
      console.error(err);
    } finally {
      this.refreshingPayer = false;
    }
  };

  private usePayerAccount = (): boolean => {
    if (this._remainingCapacity === 0) return false;
    this._remainingCapacity--;
    if (this._remainingCapacity <= 50) {
      this.refreshPayerAccount();
    }
    return true;
  };

  private updateProgramId = (
    programId: PublicKey,
    connection: Connection,
    onProgramAccount: ProgramAccountChangeCallback
  ) => {
    if (this._programId?.equals(programId)) return;
    this._programId = programId;

    if (this.programSubscriptionId) {
      connection.removeProgramAccountChangeListener(this.programSubscriptionId);
    }
    this.programSubscriptionId = connection.onProgramAccountChange(
      programId,
      onProgramAccount
    );
  };
}
