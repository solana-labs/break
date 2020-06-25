import { Connection, FeeCalculator, Account, PublicKey } from "@solana/web3.js";
import { sleep } from "../utils";
import Faucet from "../faucet";
import FeeAccountSupply from "./fee_accounts";
import ProgramAccountSupply from "./program_accounts";
import { TX_PER_ACCOUNT } from "./accounts";

export default class Supply {
  constructor(
    private connection: Connection,
    private feeCalculator: FeeCalculator,
    private feeAccounts: FeeAccountSupply,
    private programAccounts: ProgramAccountSupply
  ) {}

  accountCapacity = (): number => {
    return TX_PER_ACCOUNT;
  };

  createAccounts = async (
    paymentKey: string,
    count: number
  ): Promise<{
    programAccounts: Array<Account>;
    feeAccounts: Array<Account>;
  }> => {
    const fromAccount = new Account(Buffer.from(paymentKey, "base64"));
    const latestBalance = await this.connection.getBalance(
      fromAccount.publicKey,
      "single"
    );

    const lamports = this.calculateCost(count, false);
    if (this.feeCalculator.lamportsPerSignature + lamports > latestBalance) {
      throw new Error("Insufficient funds");
    }

    const feeAccounts = await this.feeAccounts.supply.createBatch(
      fromAccount,
      count
    );
    const programAccounts = await this.programAccounts.supply.createBatch(
      fromAccount,
      count
    );

    const createdAccounts = Math.min(
      feeAccounts.length,
      programAccounts.length
    );
    return {
      feeAccounts: feeAccounts.slice(0, createdAccounts),
      programAccounts: programAccounts.slice(0, createdAccounts),
    };
  };

  reserveAccounts = async (count: number): Promise<boolean> => {
    return (
      (await this.feeAccounts.supply.reserve(count)) &&
      (await this.programAccounts.supply.reserve(count))
    );
  };

  unreserveAccounts = (count: number): void => {
    this.feeAccounts.supply.unreserve(count);
    this.programAccounts.supply.unreserve(count);
  };

  popAccounts = (
    count: number
  ): {
    programAccounts: Array<Account>;
    feeAccounts: Array<Account>;
  } => {
    return {
      programAccounts: this.programAccounts.supply.pop(count),
      feeAccounts: this.feeAccounts.supply.pop(count),
    };
  };

  calculateCost(accounts: number, includeFee: boolean): number {
    const fee = includeFee ? this.feeCalculator.lamportsPerSignature : 0;
    return (
      fee +
      accounts *
        (this.programAccounts.accountCost + this.feeAccounts.accountCost)
    );
  }

  static init = async (
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator,
    programId: PublicKey
  ): Promise<Supply> => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const feeAccountSupply = await FeeAccountSupply.create(
          connection,
          faucet,
          feeCalculator
        );
        console.log("Fee Account Supply Created");
        const programAccountSupply = await ProgramAccountSupply.create(
          connection,
          faucet,
          feeCalculator,
          programId
        );
        console.log("State Account Supply Created");
        return new Supply(
          connection,
          feeCalculator,
          feeAccountSupply,
          programAccountSupply
        );
      } catch (err) {
        console.error("Failed to initialize server", err);
        await sleep(1000);
        console.log("Retrying initialization");
      }
    }
  };
}
