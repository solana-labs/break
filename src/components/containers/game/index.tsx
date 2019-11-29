import * as React from 'react';
import {Dispatch} from "redux";
import {connect} from "react-redux";

import './index.scss';
import ITransaction from "../../../reducers/transactions/model";
import {IRootAppReducerState} from "../../../reducer/model";
import {addTransaction} from "../../../actions/add-tarnsaction";
import {setTransactionInfo} from "../../../actions/set-transaction-info";
import {IService} from "../../../services/model";
import {withService} from "../../hoc-helpers/with-service";
import {ITransactionsService, TransactionInfoService} from "../../../services/transactions-service/model";
import {ButtonAnimate} from "../../ui/button-animate";
import {setStatusGame} from "../../../actions/set-status-game";
import IGame from "../../../reducers/game/model";
import {setStatisticsGame} from "../../../actions/set-statistics-game";
import {resetStatisticsGame} from "../../../actions/reset-statistics-game";
import {resetTransactions} from "../../../actions/reset-tarnsactions";

interface IDispatchProps {
    dispatch: Dispatch
}

interface IStateProps {
    transactionState: ITransaction.ModelState;
    gameState: IGame.ModelState;
}

interface IServiceProps {
    transactionsService: ITransactionsService
}

interface IState {
    secondsCount: number
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {
    state: IState = {
        secondsCount: 15,
    };

    private makeTransaction = async () => {
        const status = this.props.gameState.status;

        if (status !== 'started') return;

        const countOfTransactions = this.props.transactionState.transactions.length;
        const id = 'transaction' + countOfTransactions;

        this.props.dispatch(addTransaction());

        const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(id);
        const updatedTransaction: ITransaction.Model = {
            id, info, status: 'completed',
        };

        this.props.dispatch(setTransactionInfo(updatedTransaction));
    };

    private timer = async () => {
        let timerId = setInterval(() => {
            this.setState({
                secondsCount: this.state.secondsCount - 1,
            })
        }, 1000);

        setTimeout(() => {
            clearInterval(timerId);
            this.finishGame();
        }, 15000);
    };

    private finishGame = () => {
        this.props.dispatch(setStatusGame('finished'));

        const totalCount = this.props.transactionState.transactions.length;
        const percentCapacity = parseFloat((totalCount / 50000).toFixed(3));

        this.props.dispatch(setStatisticsGame({totalCount, percentCapacity}))
    };

    private startGame = async () => {
        this.props.dispatch(setStatusGame('started'));
        this.timer();
    };

    private tryAgain = () => {
        this.props.dispatch(setStatusGame('unstarted'));
        this.props.dispatch(resetStatisticsGame());
        this.props.dispatch(resetTransactions());

        this.setState({
            secondsCount: 15,
        })
    };

    render() {
        const transactions = this.props.transactionState.transactions;
        const status = this.props.gameState.status;
        const {totalCount, percentCapacity} = this.props.gameState.statistics;
        const {secondsCount} = this.state;

        return (
          <div className={'game-wrapper'}>
              <div className={'container'}>
                  <div className={'head-block'}>
                      {
                          status === 'finished' ?
                            <div>
                                <p>Stats: </p>
                                <p>{`${totalCount} transactions`}</p>
                                <p>{`${percentCapacity}% of Solana capacity used`}</p>
                                <button className={'btn'} onClick={this.tryAgain}>Try Again</button>
                            </div> :
                            <>
                                <div className={'timer'}>
                                    <p>{`${secondsCount} seconds`}</p>
                                </div>
                                <div className={'counter'}>
                                    <p>Total amount of transactions: {transactions.length}</p>
                                </div>
                            </>
                      }
                  </div>

                  {
                      status === 'unstarted' ?
                        <div className={'start-button-block'}>
                            <ButtonAnimate name={'Begin'} onClick={this.startGame}/>
                        </div> :
                        <div className={'square-container'} onClick={this.makeTransaction}>
                            {transactions && transactions.map((item: ITransaction.Model) => (
                              <div key={item.id} className={`square ${item.status} animated zoomInRight`}/>
                            ))}
                        </div>
                  }
              </div>
          </div>
        )
    }
}

const mapServicesToProps = ({transactionsService}: IService) => ({transactionsService});

const mapStateToProps = ({transactionState, gameState}: IRootAppReducerState) => ({transactionState, gameState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
  withService(mapServicesToProps)(Game)
);