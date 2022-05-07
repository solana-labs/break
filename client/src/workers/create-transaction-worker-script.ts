import {
  Transaction,
  PublicKey,
  Keypair,
  ComputeBudgetProgram,
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
    additionalFee,
  } = message;

  const transaction = new Transaction();
  if (additionalFee) {
    transaction.add(
      ComputeBudgetProgram.requestUnits({
        units: 100_000,
        additionalFee,
      })
    );
  }
  transaction.add({
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
  transaction.recentBlockhash = blockhash;
  transaction.sign(Keypair.fromSecretKey(feeAccountSecretKey));

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
