import * as React from "react";

import { AccountInfo, Connection } from "@solana/web3.js";
import { useConfig } from "../api";
import { useDispatch, ActionType } from "./index";
import * as Bytes from "utils/bytes";

type Props = { children: React.ReactNode };
export function ConfirmedHelper({ children }: Props) {
  const dispatch = useDispatch();
  const config = useConfig();

  React.useEffect(() => {
    if (!config) return;

    const connection = new Connection(config.clusterUrl, "recent");
    const rootSubscription = connection.onRootChange((root: number) =>
      dispatch({ type: ActionType.RecordRoot, root })
    );

    const partitionCount = config.programDataAccounts.length;
    const accountSubscriptions = config.programDataAccounts.map(
      (account, partition) => {
        return connection.onAccountChange(
          account,
          (accountInfo: AccountInfo, { slot }) => {
            const ids = new Set(Bytes.toIds(accountInfo.data));
            const activeIdPartition = { ids, partition, partitionCount };
            dispatch({ type: ActionType.UpdateIds, activeIdPartition, slot });
          }
        );
      }
    );

    return () => {
      connection.removeRootChangeListener(rootSubscription);
      accountSubscriptions.forEach(listener => {
        connection.removeAccountChangeListener(listener);
      });
    };
  }, [dispatch, config]);

  return <>{children}</>;
}
