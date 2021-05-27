import React from "react";
import {
  Account,
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { useConfig } from "providers/server/http";
import { useConnection } from "providers/rpc";
import { useWalletState } from "./wallet";
import { FEE_PAYERS, sleep } from "utils";

export type Status =
  | "initializing"
  | "inactive"
  | "creating"
  | "closing"
  | "active";

export interface AccountsConfig {
  programAccounts: PublicKey[];
  feeAccounts: Account[];
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
  const breakProgramId = useConfig()?.programId;

  React.useEffect(() => {
    calculationCounter.current++;
    setStatus("initializing");
    setAccounts(undefined);
    if (!connection) return;
    const savedCounter = calculationCounter.current;
    (async () => {
      while (true) {
        try {
          const accountCosts = await calculateCosts(connection);
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
  }, [connection]);

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
        await _closeAccounts(connection, wallet);
      } finally {
        setStatus("inactive");
        creationLock.current = false;
      }
    }
  }, [creationLock, status, wallet, connection]);

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
          costs
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
  }, [creationLock, status, wallet, connection, breakProgramId, costs]);

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
const PROGRAM_ACCOUNT_SPACE = Math.ceil(1000 / FEE_PAYERS.length / TX_PER_BYTE);
const TX_PER_ACCOUNT = TX_PER_BYTE * PROGRAM_ACCOUNT_SPACE;

const _closeAccounts = async (
  connection: Connection,
  payer: Account
): Promise<void> => {
  const tx = new Transaction();
  const feePayers = FEE_PAYERS;
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
  connection: Connection
): Promise<AccountCosts> => {
  const programAccountCost = await calculateMinimalRent(
    connection,
    PROGRAM_ACCOUNT_SPACE
  );
  const feeAccountRent = await calculateMinimalRent(connection, 0);
  const { feeCalculator } = await connection.getRecentBlockhash();
  const signatureFee = feeCalculator.lamportsPerSignature;
  const feeAccountCost = TX_PER_ACCOUNT * signatureFee + feeAccountRent;

  return {
    feeAccountCost,
    programAccountCost,
    total: FEE_PAYERS.length * (programAccountCost + feeAccountCost),
  };
};

const _createAccounts = async (
  connection: Connection,
  breakProgramId: PublicKey,
  payer: Account,
  costs: AccountCosts
): Promise<AccountsConfig> => {
  const tx = new Transaction();
  const feePayers = FEE_PAYERS;
  const programAccounts = [];

  for (let i = 0; i < feePayers.length; i++) {
    programAccounts.push(new Account());
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: programAccounts[i].publicKey,
        lamports: costs.programAccountCost,
        space: PROGRAM_ACCOUNT_SPACE,
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

  return {
    accountCapacity: TX_PER_ACCOUNT,
    feeAccounts: feePayers,
    programAccounts: programAccounts.map((a) => a.publicKey),
  };
};

const calculateMinimalRent = async (
  connection: Connection,
  space: number
): Promise<number> => {
  const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(
    space
  );
  const slotsPerEpoch = 432_000;
  // const { slotsPerEpoch } = await connection.getEpochSchedule();
  const slotsPerSecond = 2.5;
  const slotsPerYear = 365.25 * 24.0 * 60.0 * 60.0 * slotsPerSecond;
  const epochsPerYear = slotsPerYear / slotsPerEpoch;
  const paddingMultiplier = 2.0;
  const rentPerEpoch = Math.round(
    (paddingMultiplier * rentExemptBalance) / (2.0 * epochsPerYear)
  );

  // Create accounts with enough rent for 3 epochs. This ensures that even if
  // accounts are created right before an epoch boundary, they will still be
  // usable in the next epoch.
  return Math.ceil(3 * rentPerEpoch);
};
