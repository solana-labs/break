import React from "react";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { useServerConfig } from "providers/server/http";
import { useConnection } from "providers/rpc";
import { useWalletState } from "./wallet";
import { getFeePayers, sleep } from "utils";
import { useClientConfig } from "./config";

export type Status =
  | "initializing"
  | "inactive"
  | "creating"
  | "closing"
  | "active";

export interface AccountsConfig {
  programAccounts: PublicKey[];
  feePayerKeypairs: Keypair[];
  accountCapacity: number;
}

interface AccountCosts {
  total: number;
  feeAccountCost: number;
  programAccountCost: number;
}

interface State {
  status: Status;
  accounts?: AccountsConfig;
  creationCost?: number;
  deactivate: () => void;
  createAccounts: () => Promise<void>;
  closeAccounts: () => Promise<void>;
}

const StateContext = React.createContext<State | undefined>(undefined);

type Props = { children: React.ReactNode };
export function AccountsProvider({ children }: Props) {
  const [costs, setCosts] = React.useState<AccountCosts>();
  const [status, setStatus] = React.useState<Status>("initializing");
  const [accounts, setAccounts] = React.useState<AccountsConfig>();
  const connection = useConnection();
  const wallet = useWalletState().wallet;
  const creationLock = React.useRef(false);
  const calculationCounter = React.useRef(0);
  const breakProgramId = useServerConfig()?.programId;
  const [{ parallelization }] = useClientConfig();

  React.useEffect(() => {
    calculationCounter.current++;
    setStatus("initializing");
    setAccounts(undefined);
    if (!connection) return;
    const savedCounter = calculationCounter.current;
    (async () => {
      while (true) {
        try {
          const accountCosts = await calculateCosts(
            connection,
            parallelization
          );
          if (calculationCounter.current === savedCounter) {
            setCosts(accountCosts);
            setStatus((status) => {
              if (status === "initializing") {
                return "inactive";
              }
              return status;
            });
            return;
          }
        } catch (err) {
          console.error("Failed to calculate account costs, retrying", err);
        }

        await sleep(2000);
      }
    })();
  }, [connection, parallelization]);

  const deactivate = React.useCallback(() => {
    if (!creationLock.current) setStatus("inactive");
  }, [creationLock]);

  const closeAccounts = React.useCallback(async () => {
    if (!connection) {
      throw new Error("Can't close accounts until connection is valid");
    } else if (!wallet) {
      throw new Error("Can't create accounts if wallet is not setup");
    } else if (creationLock.current) {
      console.warn("Account closing is locked");
      return;
    } else if (status === "inactive") {
      creationLock.current = true;
      setStatus("closing");
      try {
        await _closeAccounts(connection, wallet, parallelization);
      } finally {
        setStatus("inactive");
        creationLock.current = false;
      }
    }
  }, [creationLock, status, wallet, connection, parallelization]);

  const createAccounts = React.useCallback(async () => {
    if (!connection) {
      throw new Error("Invalid connection");
    } else if (!breakProgramId) {
      throw new Error("Missing break program id");
    } else if (!wallet) {
      throw new Error("Missing wallet");
    } else if (!costs) {
      throw new Error("Calculating costs");
    } else if (creationLock.current) {
      console.warn("Account creation is locked");
      return;
    } else if (status === "inactive") {
      creationLock.current = true;
      setStatus("creating");
      try {
        const newAccounts = await _createAccounts(
          connection,
          breakProgramId,
          wallet,
          costs,
          parallelization
        );
        setAccounts(newAccounts);
        setStatus("active");
      } catch (err) {
        setStatus("inactive");
      } finally {
        creationLock.current = false;
      }
    } else {
      console.warn("Account creation requires inactive status", status);
    }
  }, [
    creationLock,
    status,
    wallet,
    connection,
    breakProgramId,
    costs,
    parallelization,
  ]);

  const state: State = React.useMemo(
    () => ({
      status,
      accounts,
      creationCost: costs?.total,
      deactivate,
      closeAccounts,
      createAccounts,
    }),
    [status, accounts, costs, deactivate, closeAccounts, createAccounts]
  );

  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

export function useAccountsState() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useAccountsState must be used within a AccountsProvider`);
  }
  return context;
}

const TX_PER_BYTE = 8;

function calculateProgramAccountSpace(parallelization: number) {
  return Math.ceil(1000 / parallelization / TX_PER_BYTE);
}

function calculateTransactionsPerAccount(programAccountSpace: number) {
  return TX_PER_BYTE * programAccountSpace;
}

const _closeAccounts = async (
  connection: Connection,
  payer: Keypair,
  parallelization: number
): Promise<void> => {
  const tx = new Transaction();
  const feePayers = getFeePayers(parallelization);
  const balances = await Promise.all(
    feePayers.map((feePayer) => {
      return connection.getBalance(feePayer.publicKey);
    })
  );
  for (let i = 0; i < feePayers.length; i++) {
    const feePayer = feePayers[i].publicKey;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: feePayer,
        toPubkey: payer.publicKey,
        lamports: balances[i],
      })
    );
  }

  await sendAndConfirmTransaction(connection, tx, [payer, ...feePayers]);
};

const calculateCosts = async (
  connection: Connection,
  parallelization: number
): Promise<AccountCosts> => {
  const programAccountSpace = calculateProgramAccountSpace(parallelization);
  const programAccountCost = await connection.getMinimumBalanceForRentExemption(
    programAccountSpace
  );
  const feeAccountRent = await connection.getMinimumBalanceForRentExemption(0);
  const { feeCalculator } = await connection.getRecentBlockhash();
  const signatureFee = feeCalculator.lamportsPerSignature;
  const txPerAccount = calculateTransactionsPerAccount(programAccountSpace);
  const feeAccountCost = txPerAccount * signatureFee + feeAccountRent;

  return {
    feeAccountCost,
    programAccountCost,
    total: parallelization * (programAccountCost + feeAccountCost),
  };
};

const _createAccounts = async (
  connection: Connection,
  breakProgramId: PublicKey,
  payer: Keypair,
  costs: AccountCosts,
  parallelization: number
): Promise<AccountsConfig> => {
  const tx = new Transaction();
  const programAccountSpace = calculateProgramAccountSpace(parallelization);
  const feePayers = getFeePayers(parallelization);
  const programAccounts = [];

  for (let i = 0; i < feePayers.length; i++) {
    programAccounts.push(new Keypair());
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: programAccounts[i].publicKey,
        lamports: costs.programAccountCost,
        space: programAccountSpace,
        programId: breakProgramId,
      })
    );
    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: feePayers[i].publicKey,
        lamports: costs.feeAccountCost,
      })
    );
  }

  await sendAndConfirmTransaction(connection, tx, [payer, ...programAccounts]);

  const txPerAccount = calculateTransactionsPerAccount(programAccountSpace);
  return {
    accountCapacity: txPerAccount,
    feePayerKeypairs: feePayers,
    programAccounts: programAccounts.map((a) => a.publicKey),
  };
};
