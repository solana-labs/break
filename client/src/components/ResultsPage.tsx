import * as React from "react";
import { Doughnut } from "react-chartjs-2";
import { useHistory, useLocation } from "react-router-dom";

import { TransactionContainer } from "components/TxContainer";
import { TransactionModal } from "components/TxModal";
import {
  useConfirmedCount,
  useCreatedCount,
  useDroppedCount,
  useAvgConfirmationTime
} from "providers/transactions";
import { Header } from "./Header";
import { COUNTDOWN_SECS } from "providers/game";

export default function Results() {
  const history = useHistory();
  const location = useLocation();
  const createdCount = useCreatedCount();

  React.useEffect(() => {
    if (createdCount === 0) {
      history.push({ ...location, pathname: "/game" });
    }
  }, [createdCount, history, location]);

  return (
    <div className="container min-vh-100 d-flex flex-column">
      <div>
        <Header />
        <Stats />
        <Summary />
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

function Summary() {
  const confirmedCount = useConfirmedCount();
  const capacityUsed = (100 * confirmedCount) / (COUNTDOWN_SECS * 50000);
  return (
    <div className="row justify-content-center mb-5 results-summary px-4">
      <h3 className="text-center">
        With{" "}
        <span className="text-primary font-weight-bold">{confirmedCount}</span>{" "}
        transactions in {COUNTDOWN_SECS} seconds you took up{" "}
        <span className="text-primary font-weight-bold">
          {capacityUsed.toFixed(3)}%
        </span>{" "}
        of Solana’s capacity.
      </h3>
      {/* <h3 className="text-center">
        Today, players around the world have submitted{" "}
        <span className="text-primary font-weight-bold">{confirmedCount}</span>{" "}
        transactions, which is{" "}
        <span className="text-primary font-weight-bold">
          {capacityUsed.toFixed(3)}%
        </span>{" "}
        of Solana’s capacity.
      </h3> */}
    </div>
  );
}

function Stats() {
  const createdCount = useCreatedCount();
  const confirmedCount = useConfirmedCount();
  const droppedCount = useDroppedCount();
  const avgConfTime = useAvgConfirmationTime();

  const hasTxData = createdCount > 0;
  let processingCount = createdCount - confirmedCount - droppedCount;
  if (!hasTxData) processingCount = 1;
  const txData = {
    labels: ["Confirmed", "Dropped", "Processing"],
    datasets: [
      {
        data: [confirmedCount, droppedCount, processingCount],
        borderColor: ["#000", "#000", "#000"],
        backgroundColor: ["#00ffad", "#ea134d", "#2A2A2A"]
      }
    ]
  };

  const hasCapacityData = confirmedCount > 0;
  const capacityUsed = (100 * confirmedCount) / (COUNTDOWN_SECS * 50000);
  const roundCapacityUsed = hasCapacityData
    ? Math.max(0.5, parseFloat(capacityUsed.toFixed(2)))
    : 0;
  const capacityData = {
    datasets: [
      {
        data: [roundCapacityUsed, 100 - roundCapacityUsed],
        borderColor: ["#000", "#000"],
        backgroundColor: ["#00ffad", "#2A2A2A"]
      }
    ]
  };

  const hasConfData = !!avgConfTime;
  const numSegments = 50;
  const confData = {
    datasets: [
      {
        data: new Array(numSegments).fill(1),
        borderColor: new Array(numSegments).fill("#000"),
        backgroundColor: new Array(numSegments).fill(
          hasConfData ? "#00ffad" : "#2A2A2A"
        )
      }
    ]
  };

  const legend = {
    display: false
  };
  const options = {
    showLines: false,
    cutoutPercentage: 90,
    maintainAspectRatio: false
  };

  return (
    <div className="row justify-content-center">
      <div className="position-relative mb-5 stat-circle">
        <Doughnut data={capacityData} legend={legend} options={options} />
        <div className="donut-content">
          <h2 className="mb-3">{capacityUsed.toFixed(3)}%</h2>
          <h6 className="text-muted text-center text-uppercase">
            Capacity Used
          </h6>
        </div>
      </div>

      <div className="position-relative mb-5 stat-circle d-none d-md-inline">
        <Doughnut data={txData} legend={legend} options={options} />
        <div className={`donut-content${hasTxData ? " allow-events" : ""}`}>
          <h2 className="mb-3">
            {confirmedCount} of {createdCount}
          </h2>
          <h6 className="text-muted text-center text-uppercase">
            Transactions Processed
          </h6>
        </div>
      </div>

      <div className="position-relative mb-5 stat-circle d-none d-lg-inline-block">
        <Doughnut data={confData} legend={legend} options={options} />
        <div className="donut-content">
          <h2 className="mb-3">
            {avgConfTime ? avgConfTime.toFixed(2) + "s" : "---"}
          </h2>
          <h6 className="text-muted text-center text-uppercase">
            Avg. Confirmation Time
          </h6>
        </div>
      </div>
    </div>
  );
}
