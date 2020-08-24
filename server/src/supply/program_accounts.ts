import {
  Account,
  Connection,
  FeeCalculator,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import AccountSupply, { TX_PER_ACCOUNT } from "./accounts";
import Faucet from "../faucet";
import { confirmTransaction } from "../utils";

const TX_PER_BYTE = 8;

// Provides program state accounts for break game clients
export default class ProgramAccountSupply {
  constructor(public supply: AccountSupply, public accountCost: number) {}

  static async create(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator,
    programId: PublicKey
  ): Promise<ProgramAccountSupply> {
    const space = Math.ceil(TX_PER_ACCOUNT / TX_PER_BYTE);
    const rent = await AccountSupply.calculateRent(connection, space);
    const supply = new AccountSupply(
      "Program Data Account Supply",
      faucet.feeAccount,
      async (fromAccount: Account) => {
        const programDataAccount = new Account();
        const signature = await connection.sendTransaction(
          SystemProgram.createAccount({
            fromPubkey: fromAccount.publicKey,
            newAccountPubkey: programDataAccount.publicKey,
            lamports: rent,
            space,
            programId,
          }),
          [fromAccount, programDataAccount],
          { skipPreflight: true }
        );
        await confirmTransaction(connection, signature);
        return programDataAccount;
      }
    );
    const signatureFee = feeCalculator.lamportsPerSignature;
    const cost = rent + 2 * signatureFee;
    return new ProgramAccountSupply(supply, cost);
  }
}
