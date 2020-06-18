import { Connection, FeeCalculator, PublicKey } from "@solana/web3.js";
import { sleep } from "../utils";
import Faucet from "../faucet";
import FeeAccountSupply from "./fee_accounts";
import ProgramAccountSupply from "./state_accounts";
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

  isDepleted = (requestedCount: number): boolean => {
    return (
      this.feeAccountSupply.size() < requestedCount ||
      this.programAccountSupply.size() < requestedCount
    );
  };

  consumeAccounts = (count: number) => {
    const programAccountAddresses = this.programAccountSupply
      .pop(count)
      .map((account) => account.publicKey.toBase58());
    const feeAccountKeys = this.feeAccountSupply.pop(count).map((account) => {
      return Buffer.from(account.secretKey).toString("base64");
    });
    return { programAccountAddresses, feeAccountKeys };
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
