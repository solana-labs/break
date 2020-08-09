import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  Account,
} from "@solana/web3.js";
import * as Bytes from "utils/bytes";
import { CreateTransactionMessage } from "./create-transaction-rpc";

const ctx: Worker = self as any;

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

  ctx.postMessage({
    trackingId: trackingId,
    signature: signatureBuffer,
    serializedTransaction: transaction.serialize(),
  });
}

ctx.onmessage = (event: any) => {
  const message: CreateTransactionMessage = event.data;

  try {
    createTransaction(message);
  } catch (error) {
    ctx.postMessage({
      trackingId: message.trackingId,
      error: error,
    });
  }
};

export default {} as typeof Worker & { new (): Worker };
