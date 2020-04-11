import * as React from "react";

import "./index.scss";
import * as ITransaction from "../../../reducers/transactions/model";
import Popover from "react-popover";

interface IProps {
  status: ITransaction.Status;
  information: ITransaction.Info;
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
    const { status } = this.props;
    const { confirmationTime, signature, userSent } = this.props.information;

    function displaySentBy() {
      if (!userSent) {
        return <p>Sent by another user</p>;
      }

      return null;
    }

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
      if (typeof status === "object" && "msg" in status) {
        return <p>Error: {status.msg}</p>;
      }
      return null;
    }

    return (
      <div className={"square-info-container"}>
        {displaySentBy()}
        {displayConfTime()}
        {displaySignature()}
        {displayErrorMsg()}
      </div>
    );
  };

  render() {
    const { status, clusterParam } = this.props;
    const { signature, userSent } = this.props.information;
    const hovered = this.state.popoverOpen ? "hovered" : "";
    const notUserSent = userSent ? "" : "not-user-sent";
    const noEvent = !signature && userSent ? "no-event" : "";

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
            className={`square slideInRight ${statusClass} ${completedClass} ${hovered} ${notUserSent} ${noEvent}`}
          />
        }
      </Popover>
    );
  }
}
