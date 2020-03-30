import * as React from "react";
import { Dispatch } from "redux";
import { connect } from "react-redux";
import debounce from "lodash/debounce";

import "./index.scss";
import * as ITransaction from "../../../reducers/transactions/model";
import TransactionSquare from "../transaction-square";
import { IRootAppReducerState } from "../../../reducer/model";
import { addTransaction } from "../../../actions/add-transaction";
import { updateTransaction } from "../../../actions/set-transaction-info";
import { IService } from "../../../services";
import { withService } from "../../hoc-helpers/with-service";
import { TransactionService } from "../../../services/transaction";
import { setStatusLoader } from "../../../actions/set-status-loader";
import { FacebookShareButton, TwitterShareButton } from "react-share";

import tapIcon from "@images/icons/tap.svg";
import shareTwitterIcon from "@images/share-twitter.svg";
import shareFacebookIcon from "@images/share-facebook-2.svg";
import { setTransactionsPerSecond } from "@/actions/set-transactions-per-second";

interface IDispatchProps {
  dispatch: Dispatch;
}

interface IStateProps {
  transactionState: ITransaction.ModelState;
}

interface IServiceProps {
  transactionService: TransactionService;
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, { clusterUrl: string }> {
  _timerId?: number;
  _timeoutId?: number;
  _updateDebounced = debounce(this.forceUpdate, 1000 / 60, { leading: true });

  shouldComponentUpdate() {
    this._updateDebounced();
    return false;
  }

  private makeTransaction = () => {
    try {
      const {
        accountId,
        signature
      } = this.props.transactionService.sendTransaction();
      this.props.dispatch(addTransaction(accountId, signature));
    } catch (err) {
      console.error("failed to send transaction", err);
      this.props.transactionService.reconnect();
    }
    this.updateScroll();
  };

  private onTransaction = (transaction: ITransaction.Model) => {
    const { userSent, accountId, signature } = transaction.info;
    if (!userSent) {
      this.props.dispatch(addTransaction(accountId, signature));
    }
    this.props.dispatch(updateTransaction(transaction));
  };

  private updateScroll = () => {
    const scrollSquareContainer: HTMLElement | null = document.getElementById(
      "scroll-square-container"
    );
    if (scrollSquareContainer) {
      scrollSquareContainer.scrollTop = scrollSquareContainer.scrollHeight;
    }
  };

  private onConnected = (clusterUrl: string) => {
    this.setState({ clusterUrl });
    this.props.dispatch(setStatusLoader(false));
    this.setTimerForSendTransaction();
    document.addEventListener("keyup", this.makeTransaction);
  };

  private onDisconnected = () => {
    this.props.dispatch(setStatusLoader(true));
    clearInterval(this._timerId);
    clearTimeout(this._timeoutId);
    document.removeEventListener("keyup", this.makeTransaction);
  };

  private setTimerForSendTransaction = () => {
    this._timerId = window.setInterval(() => {
      const transactionConfirmedEarlier = this.props.transactionState
        .allCompletedCount;

      this._timeoutId = window.setTimeout(() => {
        const transactionConfirmedNow = this.props.transactionState
          .allCompletedCount;
        const tps = transactionConfirmedNow - transactionConfirmedEarlier;
        this.props.dispatch(setTransactionsPerSecond(tps));
      }, 1000);
    }, 250);
  };

  componentDidMount() {
    this.props.dispatch(setStatusLoader(true));
    this.props.transactionService.connect(
      this.onConnected,
      this.onDisconnected,
      this.onTransaction
    );
  }

  componentWillUnmount() {
    this.props.transactionService.disconnect();
    this._updateDebounced.cancel();
  }

  render() {
    const transactions = this.props.transactionState.transactions;
    const completedCount = this.props.transactionState.userCompletedCount;
    const tps = this.props.transactionState.transactionsPerSecond;
    const percentCapacity = parseFloat(((tps / 50000) * 100).toFixed(4));

    return (
      <div className={"game-wrapper"}>
        <div className={"container"}>
          <div className={"play-zone-wrapper"}>
            <div className={"timer"}>
              <p>Transactions Created</p>
              <p>{transactions.length}</p>
            </div>
            <div className={"counter"}>
              <p>Transactions Confirmed</p>
              <p>{completedCount}</p>
            </div>
            <div className={"capacity"}>
              <p>Solana Capacity Used</p>
              <p>{percentCapacity} %</p>
            </div>
            <div className={"speed"}>
              <p>Transactions per Second</p>
              <p>{tps}</p>
            </div>

            <div className={`square-container-wrapper`}>
              <div
                id={"scroll-square-container"}
                className={`square-container`}
                tabIndex={0}
              >
                {transactions &&
                  transactions.map((item: ITransaction.Model) => (
                    <TransactionSquare
                      key={item.info.accountId}
                      status={item.status}
                      information={item.info}
                      clusterUrl={this.state.clusterUrl}
                    />
                  ))}
              </div>
            </div>

            <button className={`click-zone`} onClick={this.makeTransaction}>
              <div className={"tap-icon-wrapper"}>
                <img src={tapIcon} alt="tap" />
                <p>
                  tap <br /> here
                </p>
              </div>
              <p className={"info"}>Or use keyboard button</p>
            </button>
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
                <img src={shareTwitterIcon} />
              </TwitterShareButton>
              <FacebookShareButton
                className={"share-button"}
                quote={`Currently, all players online are creating ${tps} TPS, which means they are using ${percentCapacity}% of Solana capacity. \n\nYou can join us and try to break Solana:`}
                url={"https://break.solana.com/"}
              >
                <img src={shareFacebookIcon} />
              </FacebookShareButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapServicesToProps = ({ transactionService }: IService) => ({
  transactionService
});

const mapStateToProps = ({ transactionState }: IRootAppReducerState) => ({
  transactionState
});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
  withService(mapServicesToProps)(Game)
);
