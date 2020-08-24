import {
  Account,
  Connection,
  FeeCalculator,
  SystemProgram,
} from "@solana/web3.js";
import AccountSupply, { TX_PER_ACCOUNT } from "./accounts";
import Faucet from "../faucet";
import { confirmTransaction } from "../utils";

// Provides pre-funded accounts for break game clients
export default class FeeAccountSupply {
  constructor(public supply: AccountSupply, public accountCost: number) {}

  static async create(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator
  ): Promise<FeeAccountSupply> {
    const rent = await AccountSupply.calculateRent(connection, 0);
    const signatureFee = feeCalculator.lamportsPerSignature;
    const fundAmount = TX_PER_ACCOUNT * (signatureFee + rent) + rent;
    const supply = new AccountSupply(
      "Fee Account Supply",
      faucet.feeAccount,
      async (fromAccount: Account) => {
        const account = new Account();
        const signature = await connection.sendTransaction(
          SystemProgram.transfer({
            fromPubkey: fromAccount.publicKey,
            toPubkey: account.publicKey,
            lamports: fundAmount,
          }),
          [fromAccount],
          { skipPreflight: true }
        );
        await confirmTransaction(connection, signature);
        return account;
      }
    );
    const cost = fundAmount + signatureFee;
    return new FeeAccountSupply(supply, cost);
  }
}
