import * as React from "react";
import { Doughnut, ChartData } from "react-chartjs-2";
import { Redirect, useLocation } from "react-router-dom";

import { TransactionContainer } from "components/TxContainer";
import { TransactionModal } from "components/TxModal";
import {
  useConfirmedCount,
  useCreatedCount,
  useDroppedCount,
  useAvgConfirmationTime,
} from "providers/transactions";
import { useClientConfig } from "providers/config";

export function ResultsPage() {
  const createdCount = useCreatedCount();
  const location = useLocation();

  if (createdCount === 0) {
    return <Redirect to={{ ...location, pathname: "/game" }} />;
  }

  return (
    <div className="container d-flex flex-grow-1 flex-column my-4">
      <div>
        <Stats />
        <Summary />
      </div>
      <div className="row flex-grow-1">
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
  const [{ countdownSeconds }] = useClientConfig();
  const capacityUsed = {
    solana: (100 * confirmedCount) / (countdownSeconds * 50000),
    bitcoin: (100 * confirmedCount) / (countdownSeconds * 4.6),
    ethereum: (100 * confirmedCount) / (countdownSeconds * 15),
  };

  return (
    <div className="row justify-content-center mb-5 results-summary px-4">
      <div className="col-12">
        <h3 className="text-center">
          With{" "}
          <span className="text-primary font-weight-bold">
            {confirmedCount}
          </span>{" "}
          transactions in {countdownSeconds} seconds you took up{" "}
          <span className="text-primary font-weight-bold">
            {capacityUsed.solana.toFixed(3)}%
          </span>{" "}
          of Solana’s capacity.
        </h3>
        <h3 className="text-center">
          Processing the same amount of transactions would have taken up{" "}
          <span className="text-primary font-weight-bold">
            {capacityUsed.ethereum.toFixed(1)}%
          </span>{" "}
          of Ethereum’s capacity and{" "}
          <span className="text-primary font-weight-bold">
            {capacityUsed.bitcoin.toFixed(1)}%
          </span>{" "}
          of Bitcoin’s capacity.
        </h3>
      </div>
    </div>
  );
}

function Stats() {
  const createdCount = useCreatedCount();
  const confirmedCount = useConfirmedCount();
  const droppedCount = useDroppedCount();
  const avgConfTime = useAvgConfirmationTime();
  const [{ countdownSeconds }] = useClientConfig();

  const hasTxData = createdCount > 0;
  let processingCount = createdCount - confirmedCount - droppedCount;
  if (!hasTxData) processingCount = 1;
  const txData = {
    labels: ["Confirmed", "Dropped", "Processing"],
    datasets: [
      {
        data: [confirmedCount, droppedCount, processingCount],
        borderColor: ["#000", "#000", "#000"],
        backgroundColor: ["#00ffad", "#ea134d", "#2A2A2A"],
      },
    ],
  };

  const hasCapacityData = confirmedCount > 0;
  const capacityUsed = (100 * confirmedCount) / (countdownSeconds * 50000);
  const roundCapacityUsed = hasCapacityData
    ? Math.max(0.5, parseFloat(capacityUsed.toFixed(2)))
    : 0;
  const capacityData = {
    datasets: [
      {
        data: [roundCapacityUsed, 100 - roundCapacityUsed],
        borderColor: ["#000", "#000"],
        backgroundColor: ["#00ffad", "#2A2A2A"],
      },
    ],
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
        ),
      },
    ],
  };

  return (
    <div className="d-flex justify-content-center">
      <div className="stats d-flex mb-5 justify-content-between w-100">
        <StatCircle
          data={confData}
          title="Average Confirmation"
          value={avgConfTime ? avgConfTime.toFixed(2) + "s" : "---"}
        />
        <StatCircle
          data={txData}
          title="Transactions Processed"
          value={`${confirmedCount} of ${createdCount}`}
        />
        <StatCircle
          data={capacityData}
          title="Capacity Used"
          value={capacityUsed.toFixed(3) + "%"}
        />
      </div>
    </div>
  );
}

const STAT_LEGEND = {
  display: false,
};

const STAT_OPTIONS = {
  showLines: false,
  cutoutPercentage: 90,
  maintainAspectRatio: false,
};

function StatCircle({
  data,
  value,
  title,
}: {
  data: ChartData<Chart.ChartData>;
  value: string;
  title: string;
}) {
  return (
    <div className="px-4">
      <div className="position-relative stat-circle">
        <Doughnut data={data} legend={STAT_LEGEND} options={STAT_OPTIONS} />
        <div className="donut-content">
          <h2 className="mb-3">{value}</h2>
          <h6 className="text-muted text-center text-uppercase">{title}</h6>
        </div>
      </div>
    </div>
  );
}
