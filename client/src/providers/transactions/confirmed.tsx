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

    const accountSubscription = connection.onAccountChange(
      config.programAccount,
      (accountInfo: AccountInfo, { slot }) => {
        const activeIds = new Set(Bytes.toIds(accountInfo.data));
        dispatch({ type: ActionType.UpdateIds, activeIds, slot });
      }
    );

    return () => {
      connection.removeRootChangeListener(rootSubscription);
      connection.removeAccountChangeListener(accountSubscription);
    };
  }, [dispatch, config]);

  return <>{children}</>;
}
