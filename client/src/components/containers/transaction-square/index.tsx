import * as React from "react";

import "./index.scss";
import Popover from "react-popover";
import { UserTransaction } from "providers/transactions";

interface IProps {
  transaction: UserTransaction;
  clusterParam: string;
}

interface IState {
  popoverOpen: boolean;
}

export default class TransactionSquare extends React.Component<IProps, IState> {
  state: IState = {
    popoverOpen: false
  };

  private toggle = (toState: any = null) => {
    this.setState({
      popoverOpen: toState === null ? !this.state.popoverOpen : toState
    });
  };

  private squareInfo = () => {
    const { signature, confirmationTime, status } = this.props.transaction;

    function displaySignature() {
      if (signature) {
        return <p>Signature: {signature}</p>;
      }

      return null;
    }

    function displayConfTime() {
      if (confirmationTime === Number.MAX_VALUE) {
        return <p>Unconfirmed: Timed out</p>;
      } else if (confirmationTime > 0) {
        return <p>Confirmation Time: {confirmationTime} sec</p>;
      }
      return null;
    }

    function displayErrorMsg() {
      if (typeof status === "object") {
        return <p>Error: {JSON.stringify(status)}</p>;
      }
      return null;
    }

    return (
      <div className={"square-info-container"}>
        {displayConfTime()}
        {displaySignature()}
        {displayErrorMsg()}
      </div>
    );
  };

  render() {
    const { transaction, clusterParam } = this.props;
    const { status, signature } = transaction;
    const hovered = this.state.popoverOpen ? "hovered" : "";
    const noEvent = !signature ? "no-event" : "";

    let statusClass = "";
    if (status === "success") {
      statusClass = "success";
    } else if (status === "timeout") {
      statusClass = "timeout";
    } else if (typeof status === "object" && "msg" in status) {
      statusClass = "error";
    }

    const completedClass = status !== "sent" ? "completed" : "";
    const explorerLink = signature
      ? `https://explorer.solana.com/transaction/${signature}?${clusterParam}`
      : undefined;

    return (
      <Popover
        className={"square-popover-wrapper"}
        body={this.squareInfo()}
        isOpen={this.state.popoverOpen}
        enterExitTransitionDurationMs={5}
        refreshIntervalMs={undefined}
        preferPlace={"right"}
      >
        {
          // eslint-disable-next-line
          <a
            key={0}
            href={explorerLink}
            target={"_blank"}
            rel="noopener noreferrer"
            onMouseOver={() => this.toggle(true)}
            onMouseOut={() => this.toggle(false)}
            className={`square slideInRight ${statusClass} ${completedClass} ${hovered} ${noEvent}`}
          />
        }
      </Popover>
    );
  }
}
