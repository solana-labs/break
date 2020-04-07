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
      <StatCard>
        <div className="col">
          <h6 className="text-uppercase mb-2">Transactions Sent</h6>
          <span className="h2 mb-0 text-primary">{createdCount}</span>
        </div>
        <div className="col-auto">
          <span className="h2 fe fe-send text-primary mb-0"></span>
        </div>
      </StatCard>

      <StatCard>
        <div className="col">
          <h6 className="text-uppercase mb-2">Transactions Confirmed</h6>
          <span className="h2 mb-0 text-primary">{confirmedCount}</span>
        </div>
        <div className="col-auto">
          <span className="h2 fe fe-check-circle text-primary mb-0"></span>
        </div>
      </StatCard>

      <StatCard>
        <div className="col">
          <h6 className="text-uppercase mb-2">Solana Capacity Used</h6>
          <span className="h2 mb-0 text-primary">{percentCapacity}%</span>
        </div>
        <div className="col-auto">
          <span className="h2 fe fe-disc text-primary mb-0"></span>
        </div>
      </StatCard>

      <StatCard>
        <div className="col">
          <h6 className="text-uppercase mb-2">Transactions per Second</h6>
          <span className="h2 mb-0 text-primary">{tps}</span>
        </div>
        <div className="col-auto">
          <span className="h2 fe fe-zap text-primary mb-0"></span>
        </div>
      </StatCard>
    </div>
  );
}

function StatCard({ children }: { children: React.ReactChild[] }) {
  return (
    <div className="col-6 col-lg-3 d-flex flex-column">
      <div className="card flex-grow-1">
        <div className="card-body">
          <div className="row align-items-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
