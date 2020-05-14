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

export default class Program {
  constructor(private connection: Connection) {}

  async load(faucet: Faucet, feeCalculator: FeeCalculator): Promise<PublicKey> {
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

    const programAccount = new Account();
    const loaderAccount = new Account();
    await faucet.fundAccount(loaderAccount.publicKey, fees);
    await BpfLoader.load(
      this.connection,
      loaderAccount,
      programAccount,
      elfData
    );
    return programAccount.publicKey;
  }
}
