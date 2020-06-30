import * as React from "react";

import { AccountInfo, Commitment } from "@solana/web3.js";
import { useAccounts, useConnection } from "../api";
import { useDispatch, ActionType } from "./index";
import * as Bytes from "utils/bytes";

const commitmentParam = (): Commitment => {
  const commitment = new URLSearchParams(window.location.search).get(
    "commitment"
  );
  switch (commitment) {
    case "recent":
    case "single":
    case "singleGossip":
    case "max":
    case "root": {
      return commitment;
    }
    default: {
      return "singleGossip";
    }
  }
};

type Props = { children: React.ReactNode };
export function ConfirmedHelper({ children }: Props) {
  const dispatch = useDispatch();
  const connection = useConnection();
  const accounts = useAccounts();

  React.useEffect(() => {
    if (connection === undefined || accounts === undefined) return;

    const commitment = commitmentParam();
    const partitionCount = accounts.programAccounts.length;

    const accountSubscriptions = accounts.programAccounts.map(
      (account, partition) => {
        return connection.onAccountChange(
          account,
          (accountInfo: AccountInfo, { slot }) => {
            const ids = new Set(Bytes.programDataToIds(accountInfo.data));
            const activeIdPartition = { ids, partition, partitionCount };
            dispatch({ type: ActionType.UpdateIds, activeIdPartition, slot });
          },
          commitment
        );
      }
    );

    return () => {
      accountSubscriptions.forEach((listener) => {
        connection.removeAccountChangeListener(listener);
      });
    };
  }, [dispatch, connection, accounts]);

  return <>{children}</>;
}
