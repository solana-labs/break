import {
  Account,
  Connection,
  PublicKey,
  BpfLoader,
  FeeCalculator,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import path from "path";
import _fs from "fs";
import Faucet from "./faucet";
import { sleep } from "./utils";
const fs = _fs.promises;

const ENCODED_PROGRAM_KEY = process.env.ENCODED_PROGRAM_KEY;

export default class ProgramLoader {
  private static programAccount(): Account {
    if (ENCODED_PROGRAM_KEY) {
      return new Account(Buffer.from(ENCODED_PROGRAM_KEY, "base64"));
    } else {
      return new Account();
    }
  }

  static async load(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator
  ): Promise<PublicKey> {
    const programAccount = ProgramLoader.programAccount();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // If the program account already exists, don't try to load it again
        const info = await connection.getAccountInfo(programAccount.publicKey);
        if (info?.executable) return programAccount.publicKey;

        const NUM_RETRIES = 100; /* allow some number of retries */
        const elfFile = path.join(
          __dirname,
          "..",
          "..",
          "program",
          "dist",
          "break_solana_program.so"
        );
        console.log(`Reading ${elfFile}...`);
        const elfData = await fs.readFile(elfFile);

        console.log("Loading break solana program...");
        const fees =
          feeCalculator.lamportsPerSignature *
            (BpfLoader.getMinNumSignatures(elfData.length) + NUM_RETRIES) +
          (await connection.getMinimumBalanceForRentExemption(elfData.length));

        const loaderAccount = new Account();
        await sendAndConfirmTransaction(
          connection,
          SystemProgram.transfer({
            fromPubkey: faucet.feeAccount.publicKey,
            toPubkey: loaderAccount.publicKey,
            lamports: fees,
          }),
          [faucet.feeAccount],
          { confirmations: 1, skipPreflight: true }
        );

        await BpfLoader.load(
          connection,
          loaderAccount,
          programAccount,
          elfData
        );
        console.log("Program Loaded");
        break;
      } catch (err) {
        console.error("Failed to load program", err);
        await sleep(1000);
      }
    }
    return programAccount.publicKey;
  }
}
