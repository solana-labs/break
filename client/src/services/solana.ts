import fetcher from "@/api/fetcher";
import Path from "@/api/paths";
import { Buffer } from "buffer";
import {
  Account,
  AccountInfo,
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

  initializing = false;
  onProgramAccountChange?: ProgramAccountChangeCallback;
  programSubscriptionId?: number;
  payerSubscriptionId?: number;

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

    const newPayer = new Account(Buffer.from(response.accountKey, "hex"));
    this.updatePayerAccount(newPayer, this._connection);

    const newProgramId = new PublicKey(response.programId);
    this.updateProgramId(
      newProgramId,
      this._connection,
      onProgramAccountChange
    );

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
      if (this.payerSubscriptionId) {
        this.connection.removeAccountChangeListener(this.payerSubscriptionId);
        this.payerSubscriptionId = undefined;
      }
      this._connection = undefined;
    }
    this._programId = undefined;
  };

  private onPayerAccount = async (accountInfo: AccountInfo) => {
    const totalCreationCost = this.minAccountBalance + this.creationFee;
    if (accountInfo.lamports < 10 * totalCreationCost) {
      const subscriptionId = this.payerSubscriptionId;
      if (subscriptionId) {
        this.payerSubscriptionId = undefined;
        if (this._connection) {
          await this._connection.removeAccountChangeListener(subscriptionId);
        }
      }
      this.refreshPayerAccount();
    }
  };

  private refreshPayerAccount = async (): Promise<void> => {
    let response;
    let invalidResponse = true;
    while (invalidResponse) {
      response = await fetcher.get(Path.Init);
      invalidResponse = !("accountKey" in response) || !("rpcUrl" in response);
      if (invalidResponse) {
        throw new Error("Failed to refresh payer");
      }
    }

    if (!this._connection) {
      this._connection = new Connection(response.rpcUrl, "recent");
    }

    const newPayer = new Account(Buffer.from(response.accountKey, "hex"));
    this.updatePayerAccount(newPayer, this._connection);
  };

  private updatePayerAccount = (account: Account, connection: Connection) => {
    if (this._payerAccount?.publicKey.equals(account.publicKey)) return;
    this._payerAccount = account;

    if (this.payerSubscriptionId) {
      connection.removeAccountChangeListener(this.payerSubscriptionId);
    }
    this.payerSubscriptionId = connection.onAccountChange(
      account.publicKey,
      this.onPayerAccount
    );
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
