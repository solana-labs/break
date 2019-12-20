import * as React from 'react';
import {Dispatch} from "redux";
import {connect} from "react-redux";

import './index.scss';
import ITransaction from "../../../reducers/transactions/model";
import IGame from "../../../reducers/game/model";
import TransactionSquare from "../transaction-square";
import {IRootAppReducerState} from "../../../reducer/model";
import {addTransaction} from "../../../actions/add-tarnsaction";
import {setTransactionInfo} from "../../../actions/set-transaction-info";
import {IService} from "../../../services/model";
import {withService} from "../../hoc-helpers/with-service";
import {ITransactionsService, TransactionInfoService} from "../../../services/transactions-service/model";
import {setStatusGame} from "../../../actions/set-status-game";
import {setStatisticsGame} from "../../../actions/set-statistics-game";
import {resetStatisticsGame} from "../../../actions/reset-statistics-game";
import {resetTransactions} from "../../../actions/reset-tarnsactions";
import {Button} from "../../ui/button";
import {StartHead} from "../../presentational/start-head";
import FinishHead from "../../presentational/finish-head";
import {IGameService} from "../../../services/game-service/model";

interface IDispatchProps {
    dispatch: Dispatch
}

interface IStateProps {
    transactionState: ITransaction.ModelState;
    gameState: IGame.ModelState;
}

interface IServiceProps {
    transactionsService: ITransactionsService
    gameService: IGameService
}

interface IState {
    secondsCount: number,
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {
    _isMounted = false;

    state: IState = {
        secondsCount: 15,
    };

    private makeTransaction = async () => {
        const transactions = this.props.transactionState.transactions;
        let status = this.props.gameState.status;
        if (status !== 'started') return;

        const countOfTransactions = transactions.length;
        const id = 'transaction' + countOfTransactions;

        this.props.dispatch(addTransaction());

        const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(countOfTransactions);

        if(this.props.gameState.status === 'started') {
            const updatedTransaction: ITransaction.Model = {
                id, info, status: 'completed',
            };

            this.props.dispatch(setTransactionInfo(updatedTransaction));
        }
    };

    private timer = async () => {
        let timerId = setInterval(() => {
            if (this._isMounted) {
                this.setState({
                    secondsCount: this.state.secondsCount - 1,
                })
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(timerId);
            if (this._isMounted) {
                this.finishGame();
            }
        }, 15000);
    };

    private finishGame = () => {
        this.props.dispatch(setStatusGame('finished'));

        const totalCount = this.props.transactionState.transactions.length;
        const completedCount = this.props.transactionState.countCompletedTransactions;

        const percentCapacity = parseFloat((completedCount / 50000).toFixed(4));

        this.props.dispatch(setStatisticsGame({totalCount, completedCount, percentCapacity}));

        this.props.gameService.saveGame({
            transactions: completedCount
        })
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
        });
    };

    private updateScroll = () => {
        const scrollSquareContainer: HTMLElement | null = document.getElementById("scroll-square-container");
        if (scrollSquareContainer) {
            scrollSquareContainer.scrollTop = scrollSquareContainer.scrollHeight;
        }
    };

    componentDidMount() {
        this._isMounted = true;
        this.props.transactionsService.setConnection();

        document.addEventListener('keyup', (event) => {
            this.makeTransaction();
        });
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<{}>, snapshot?: any): void {
        this.updateScroll()
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.tryAgain();
    }

    render() {
        const transactions = this.props.transactionState.transactions;
        const averageTransactionsTime = this.props.transactionState.averageTransactionsTime;
        const gameStatus = this.props.gameState.status;
        const {totalCount, completedCount, percentCapacity} = this.props.gameState.statistics;
        const {secondsCount} = this.state;

        return (
            <div className={'game-wrapper'}>
                <div className={'container'}>
                    {gameStatus === 'finished' ?
                        <FinishHead
                            completedCount={completedCount}
                            totalCount={totalCount}
                            percentCapacity={percentCapacity}
                            averageTransactionsTime={averageTransactionsTime}
                            tryAgain={this.tryAgain}
                        />
                        :
                        <StartHead
                            secondsCount={secondsCount}
                            transactionsCreated={transactions.length}
                            averageTransactionsTime={averageTransactionsTime}
                        />
                    }
                    <div className={'play-zone-wrapper'}>
                        <div className={`square-container-wrapper ${gameStatus}`}>
                            {gameStatus === 'unstarted' ? <div>
                                    <Button typeButton={true} name={'Begin'}
                                            onClick={this.startGame}
                                            animate={'animated infinite pulse'}/>
                                </div> :
                                <div id={'scroll-square-container'}
                                     className={`square-container`}
                                     onClick={this.makeTransaction}
                                     tabIndex={0}
                                >
                                    {transactions && transactions.map((item: ITransaction.Model) => (
                                        <TransactionSquare
                                            key={item.id}
                                            gameStatus={gameStatus}
                                            status={item.status}
                                            information={item.info}
                                        />
                                    ))}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapServicesToProps = ({transactionsService, gameService}: IService) => ({transactionsService, gameService});

const mapStateToProps = ({transactionState, gameState}: IRootAppReducerState) => ({transactionState, gameState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
    withService(mapServicesToProps)(Game)
);