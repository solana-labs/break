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
    computeUnitPrice,
    extraWriteAccount,
  } = message;

  const transaction = new Transaction();
  if (computeUnitPrice) {
    const units = 1000;
    const MICRO_LAMPORTS_PER_LAMPORT = 1_000_000;
    const additionalFee = Math.ceil(
      (computeUnitPrice * units) / MICRO_LAMPORTS_PER_LAMPORT
    );
    transaction.add(
      ComputeBudgetProgram.requestUnits({
        units,
        additionalFee,
      })
    );
  }
  const breakAccountInputs = [
    {
      pubkey: new PublicKey(programDataAccount),
      isWritable: true,
      isSigner: false,
    },
  ];
  if (extraWriteAccount) {
    breakAccountInputs.push({
      pubkey: new PublicKey(extraWriteAccount),
      isWritable: true,
      isSigner: false,
    });
  }
  transaction.add({
    keys: breakAccountInputs,
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
