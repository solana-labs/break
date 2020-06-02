import {
  Account,
  Connection,
  PublicKey,
  BpfLoader,
  FeeCalculator
} from "@solana/web3.js";
import path from "path";
import _fs from "fs";
import Faucet from "./faucet";
const fs = _fs.promises;

const ENCODED_PROGRAM_KEY = process.env.ENCODED_PROGRAM_KEY;

export default class ProgramLoader {
  private account: Account;
  constructor(private connection: Connection) {
    if (ENCODED_PROGRAM_KEY) {
      this.account = new Account(Buffer.from(ENCODED_PROGRAM_KEY, "base64"));
    } else {
      this.account = new Account();
    }
  }

  async load(faucet: Faucet, feeCalculator: FeeCalculator): Promise<PublicKey> {
    // If the program account already exists, don't try to load it again
    const info = await this.connection.getAccountInfo(this.account.publicKey);
    if (info?.executable) return this.account.publicKey;

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
      (await this.connection.getMinimumBalanceForRentExemption(elfData.length));

    const loaderAccount = new Account();
    await faucet.fundAccount(loaderAccount.publicKey, fees);
    await BpfLoader.load(this.connection, loaderAccount, this.account, elfData);
    return this.account.publicKey;
  }
}
