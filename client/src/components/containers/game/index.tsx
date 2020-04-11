import * as React from "react";

import "./index.scss";
import { TransactionContainer } from "components/containers/transaction-container";
import { FacebookShareButton, TwitterShareButton } from "react-share";
import shareTwitterIcon from "shared/images/share-twitter.svg";
import shareFacebookIcon from "shared/images/share-facebook-2.svg";
import {
  useCreateTx,
  useTps,
  useCreatedCount,
  useConfirmedCount
} from "providers/transactions";

export default function Game() {
  const createTx = useCreateTx();
  const createTxRef = React.useRef(createTx);
  const createdCount = useCreatedCount();
  const confirmedCount = useConfirmedCount();
  const tps = useTps();
  const percentCapacity = parseFloat(((tps / 50000) * 100).toFixed(4));

  const makeTransaction = () => {
    const createTx = createTxRef.current;
    if (createTx) {
      createTx();
    }
  };

  React.useEffect(() => {
    createTxRef.current = createTx;
  }, [createTx]);

  React.useEffect(() => {
    document.addEventListener("keyup", makeTransaction);
    return () => document.removeEventListener("keyup", makeTransaction);
  }, []);

  return (
    <div className={"game-wrapper"}>
      <div className={"container"}>
        <div className={"play-zone-wrapper"}>
          <div className={"timer"}>
            <p>Transactions Created</p>
            <p>{createdCount}</p>
          </div>
          <div className={"counter"}>
            <p>Transactions Confirmed</p>
            <p>{confirmedCount}</p>
          </div>
          <div className={"capacity"}>
            <p>Solana Capacity Used</p>
            <p>{percentCapacity} %</p>
          </div>
          <div className={"speed"}>
            <p>Transactions per Second</p>
            <p>{tps}</p>
          </div>
          <TransactionContainer />
        </div>
        <div className={"share-block-wrapper"}>
          <a
            className={"build-button"}
            target={"_blank"}
            rel="noopener noreferrer"
            href="https://solana.com/developers/"
          >
            build on solana
          </a>
          <div className={"share-block"}>
            <TwitterShareButton
              className={"share-button"}
              title={`Currently, all players online are creating ${tps} TPS, which means they are using ${percentCapacity}% of Solana capacity. \n\nYou can join us and try to break Solana:`}
              url={"https://break.solana.com/"}
            >
              <img src={shareTwitterIcon} alt="share on twitter" />
            </TwitterShareButton>
            <FacebookShareButton
              className={"share-button"}
              quote={`Currently, all players online are creating ${tps} TPS, which means they are using ${percentCapacity}% of Solana capacity. \n\nYou can join us and try to break Solana:`}
              url={"https://break.solana.com/"}
            >
              <img src={shareFacebookIcon} alt="share on facebook" />
            </FacebookShareButton>
          </div>
        </div>
      </div>
    </div>
  );
}
