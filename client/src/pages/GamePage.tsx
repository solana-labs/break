import * as React from "react";
import { useHistory, useLocation } from "react-router-dom";

import { Header } from "components/Header";
import { PaymentCard } from "components/PaymentCard";
import { TransactionContainer } from "components/TxContainer";
import { TransactionModal } from "components/TxModal";
import {
  useTps,
  useCreatedCount,
  useAvgConfirmationTime,
} from "providers/transactions";
import { useAccountState } from "providers/account";
import { useActiveUsers } from "providers/socket";
import { useGameState } from "providers/game";

export default function Game() {
  const [gameState] = useGameState();
  const showPayment = gameState === "payment";
  const loading = gameState === "loading";
  const showStats = gameState === "ready" || typeof gameState === "number";
  const [account] = useAccountState();
  const history = useHistory();
  const location = useLocation();

  React.useEffect(() => {
    if (!account && showPayment)
      history.push({ ...location, pathname: "/setup" });
  }, [account, history, location, showPayment]);

  return (
    <div className="container min-vh-100 d-flex flex-column">
      <div>
        <Header />
        {showStats && <Stats />}
      </div>
      <div className="row flex-grow-1 mb-5">
        <div className="col">
          {loading || !account ? (
            <EmptyCard />
          ) : showPayment ? (
            <PaymentCard account={account} />
          ) : (
            <TransactionContainer enabled />
          )}
        </div>
      </div>
      <TransactionModal />
    </div>
  );
}

export function EmptyCard() {
  return (
    <div className="card mb-0 h-100">
      <div className="card-header"></div>
      <div className="card-body"></div>
    </div>
  );
}

function Stats() {
  const createdCount = useCreatedCount();
  const avgConfTime = useAvgConfirmationTime().toFixed(2);
  const tps = useTps();
  const activeUsers = useActiveUsers();

  return (
    <div className="row">
      <StatCard label="Transactions Sent" value={createdCount} icon="send" />
      <StatCard
        label="Avg. Confirmation Time"
        value={`${avgConfTime}s`}
        icon="clock"
      />
      <StatCard label="Players Online" value={activeUsers} icon="user" />
      <StatCard label="Transactions per Second" value={tps} icon="zap" />
    </div>
  );
}

type StatProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  icon: string;
};
function StatCard({ label, value, icon }: StatProps) {
  return (
    <div className="stat-card col-6 col-lg-3 d-flex flex-column">
      <div className="card flex-grow-1">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-12 col-md-9">
              <h6 className="text-uppercase text-truncate mb-2">{label}</h6>
              <span className="h2 mb-0 text-primary">{value}</span>
            </div>
            <div className="col-md-3 d-none d-md-block text-right">
              <span className={`h2 fe fe-${icon} text-primary mb-0`}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
