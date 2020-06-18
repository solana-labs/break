import { Connection, FeeCalculator, Account, PublicKey } from "@solana/web3.js";
import { sleep } from "../utils";
import Faucet from "../faucet";
import FeeAccountSupply from "./fee_accounts";
import ProgramAccountSupply from "./program_accounts";
import { TX_PER_ACCOUNT } from "./accounts";

export default class Supply {
  constructor(
    private feeCalculator: FeeCalculator,
    private feeAccountSupply: FeeAccountSupply,
    private programAccountSupply: ProgramAccountSupply
  ) {}

  accountCapacity = (): number => {
    return TX_PER_ACCOUNT;
  };

  reserveAccounts = (count: number): boolean => {
    return (
      this.feeAccountSupply.reserve(count) &&
      this.programAccountSupply.reserve(count)
    );
  };

  unreserveAccounts = (count: number): void => {
    this.feeAccountSupply.unreserve(count);
    this.programAccountSupply.unreserve(count);
  };

  popAccounts = (
    count: number
  ): {
    programAccounts: Array<Account>;
    feeAccounts: Array<Account>;
  } => {
    return {
      programAccounts: this.programAccountSupply.pop(count),
      feeAccounts: this.feeAccountSupply.pop(count),
    };
  };

  calculateCost(accounts: number, includeFee: boolean): number {
    const fee = includeFee ? this.feeCalculator.lamportsPerSignature : 0;
    return (
      fee +
      accounts *
        (this.programAccountSupply.accountCost +
          this.feeAccountSupply.accountCost)
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
