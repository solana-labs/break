import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  Account,
} from "@solana/web3.js";
import * as Bytes from "utils/bytes";
import { CreateTransactionMessage } from "./create-transaction-rpc";

const self: any = globalThis;

function createTransaction(message: CreateTransactionMessage) {
  const {
    trackingId,
    blockhash,
    programId,
    bitId,
    feeAccountSecretKey,
    programDataAccount,
  } = message;

  const instruction = new TransactionInstruction({
    keys: [
      {
        pubkey: new PublicKey(programDataAccount),
        isWritable: true,
        isSigner: false,
      },
    ],
    programId: new PublicKey(programId),
    data: Buffer.from(Bytes.instructionDataFromId(bitId)),
  });

  const transaction = new Transaction();
  transaction.add(instruction);
  transaction.recentBlockhash = blockhash;
  transaction.sign(new Account(feeAccountSecretKey));

  const signatureBuffer = transaction.signature;

  self.postMessage({
    trackingId: trackingId,
    signature: signatureBuffer,
    serializedTransaction: transaction.serialize(),
  });
}

self.onmessage = (event: any) => {
  const message = event.data;

  try {
    createTransaction(message);
  } catch (error) {
    self.postMessage({
      trackingId: message.trackingId,
      error: error,
    });
  }
};

export default {};
