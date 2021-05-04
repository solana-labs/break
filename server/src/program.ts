import { Account, PublicKey } from "@solana/web3.js";
import path from "path";
import fs from "fs";

const DEPLOYED_PROGRAM_ADDRESS = process.env.DEPLOYED_PROGRAM_ADDRESS;

const PROGRAM_KEYPAIR_PATH = path.resolve(
  "..",
  "program",
  "target",
  "deploy",
  "break_solana_program-keypair.json"
);

export const PROGRAM_ID = (() => {
  if (DEPLOYED_PROGRAM_ADDRESS) {
    return new PublicKey(DEPLOYED_PROGRAM_ADDRESS);
  } else {
    return readAccountFromFile(PROGRAM_KEYPAIR_PATH).publicKey;
  }
})();

/**
 * Create an Account from a keypair file
 */
function readAccountFromFile(filePath: string): Account {
  const keypairString = fs.readFileSync(filePath, { encoding: "utf8" });
  const keypairBuffer = Buffer.from(JSON.parse(keypairString));
  return new Account(keypairBuffer);
}
