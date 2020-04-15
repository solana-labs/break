import * as React from "react";

import { TransactionContainer } from "components/TxContainer";
import { TransactionModal } from "components/TxModal";
import {
  useCreateTx,
  useTps,
  useCreatedCount,
  useConfirmedCount
} from "providers/transactions";
import { Header } from "./Header";

export default function Game() {
  const createTx = useCreateTx();
  const createTxRef = React.useRef(createTx);

  React.useEffect(() => {
    createTxRef.current = createTx;
  }, [createTx]);

  React.useEffect(() => {
    const makeTransaction = () => {
      const createTx = createTxRef.current;
      if (createTx) {
        createTx();
      }
    };

    document.addEventListener("keyup", makeTransaction);
    return () => document.removeEventListener("keyup", makeTransaction);
  }, []);

  return (
    <div className="container min-vh-100 d-flex flex-column">
      <div>
        <Header />
        <Stats />
      </div>
      <div className="row flex-grow-1 mb-5">
        <div className="col">
          <TransactionContainer />
        </div>
      </div>
      <TransactionModal />
    </div>
  );
}

function Stats() {
  const createdCount = useCreatedCount();
  const confirmedCount = useConfirmedCount();
  const tps = useTps();
  const percentCapacity = parseFloat(((tps / 50000) * 100).toFixed(4));

  return (
    <div className="row">
      <StatCard label="Transactions Sent" value={createdCount} icon="send" />
      <StatCard
        label="Transactions Confirmed"
        value={confirmedCount}
        icon="check-circle"
      />
      <StatCard
        label="Solana Capacity Used"
        value={`${percentCapacity}%`}
        icon="disc"
      />
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
    <div className="col-12 col-sm-6 col-lg-3 d-flex flex-column">
      <div className="card flex-grow-1">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col">
              <h6 className="text-uppercase text-truncate mb-2">{label}</h6>
              <span className="h2 mb-0 text-primary">{value}</span>
            </div>
            <div className="col-auto d-none d-md-block">
              <span className={`h2 fe fe-${icon} text-primary mb-0`}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
