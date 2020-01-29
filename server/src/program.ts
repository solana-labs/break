import { Account, Connection, PublicKey, BpfLoader } from "@solana/web3.js";
import path from "path";
import _fs from "fs";
const fs = _fs.promises;

export default class Program {
  constructor(private connection: Connection) {}

  async load(): Promise<PublicKey> {
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
    const { feeCalculator } = await this.connection.getRecentBlockhash();
    const fees =
      feeCalculator.lamportsPerSignature *
        (BpfLoader.getMinNumSignatures(elfData.length) + NUM_RETRIES) +
      (await this.connection.getMinimumBalanceForRentExemption(elfData.length));

    const loaderAccount = new Account();
    await this.connection.requestAirdrop(loaderAccount.publicKey, fees);
    console.log("Airdropped fees for loader account");

    return BpfLoader.load(this.connection, loaderAccount, elfData);
  }
}
