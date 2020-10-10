import {
  Account,
  Connection,
  PublicKey,
  BpfLoader,
  Transaction,
  FeeCalculator,
  SystemProgram,
  sendAndConfirmTransaction,
  BPF_LOADER_DEPRECATED_PROGRAM_ID,
} from "@solana/web3.js";
import path from "path";
import _fs from "fs";
import Faucet from "./faucet";
import { sleep } from "./utils";
const fs = _fs.promises;

const ENCODED_PROGRAM_KEY = process.env.ENCODED_PROGRAM_KEY;
const DEPLOYED_PROGRAM_ADDRESS = process.env.DEPLOYED_PROGRAM_ADDRESS;

export default class ProgramLoader {
  private static programAccount(): Account {
    if (ENCODED_PROGRAM_KEY) {
      return new Account(Buffer.from(ENCODED_PROGRAM_KEY, "base64"));
    } else {
      return new Account();
    }
  }

  private static programAddress(): PublicKey {
    if (DEPLOYED_PROGRAM_ADDRESS) {
      return new PublicKey(DEPLOYED_PROGRAM_ADDRESS);
    } else {
      return ProgramLoader.programAccount().publicKey;
    }
  }

  static async load(
    connection: Connection,
    faucet: Faucet,
    feeCalculator: FeeCalculator
  ): Promise<PublicKey> {
    const programAddress = ProgramLoader.programAddress();
    const programAccount = ProgramLoader.programAccount();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // If the program account already exists, don't try to load it again
        const info = (await connection.getParsedAccountInfo(programAddress))
          .value;
        if (info?.executable) return programAddress;

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
          new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: faucet.feeAccount.publicKey,
              toPubkey: loaderAccount.publicKey,
              lamports: fees,
            })
          ),
          [faucet.feeAccount],
          { commitment: "single", skipPreflight: true }
        );

        await BpfLoader.load(
          connection,
          loaderAccount,
          programAccount,
          elfData,
          BPF_LOADER_DEPRECATED_PROGRAM_ID
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
