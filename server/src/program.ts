import { Keypair, PublicKey } from "@solana/web3.js";
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
  } else if (!process.env.DISABLE_API) {
    return readKeypairFromFile(PROGRAM_KEYPAIR_PATH).publicKey;
  }
})();

/**
 * Create a Keypair from a keypair file
 */
function readKeypairFromFile(filePath: string): Keypair {
  const keypairString = fs.readFileSync(filePath, { encoding: "utf8" });
  const keypairBuffer = Buffer.from(JSON.parse(keypairString));
  return Keypair.fromSecretKey(keypairBuffer);
}
