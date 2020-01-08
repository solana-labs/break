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

import {IGameService} from "../../../services/game-service/model";
import {setStatusLoader} from "../../../actions/set-status-loader";
import {IDefaultWebSocketService} from "../../../services/web-socket/model";


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
    wsService: IDefaultWebSocketService
}

interface IState {
    secondsCount: number,
    dayTransactionCounts: number,
    gameTransactionCounts: number,

    allTransactionCreated: number,
    transactionPerSecond: number
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {
    _isMounted = false;
    _timerId: any;

    state: IState = {
        secondsCount: 15,
        dayTransactionCounts: 0,
        gameTransactionCounts: 0,

        allTransactionCreated: 0,
        transactionPerSecond: 0
    };

    private makeTransaction = async () => {
        const transactions = this.props.transactionState.transactions;
        let status = this.props.gameState.status;
        if (status !== 'started') return;

        if (this._isMounted) {
            this.setState({
                allTransactionCreated: this.state.allTransactionCreated + 1,
            })
        }

        const countOfTransactions: number = transactions.length;
        const id = 'transaction' + countOfTransactions;

        this.props.dispatch(addTransaction());

        const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(countOfTransactions);

        if(this.props.gameState.status === 'started') {
            const updatedTransaction: ITransaction.Model = {
                id, info, status: 'completed',
            };

            this.props.dispatch(setTransactionInfo(updatedTransaction));
        }
        else if (this.props.gameState.status === 'finished') {
            const updatedTransaction: ITransaction.Model = {
                id, info, status: 'completed-after',
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

    private finishGame = async () => {
        this.props.dispatch(setStatusGame('finished'));

        const totalCount = this.props.transactionState.transactions.length;
        const completedCount = this.props.transactionState.countCompletedTransactions;

        const percentCapacity = parseFloat(((completedCount / (50000 * 15)) * 100).toFixed(4));

        this.props.dispatch(setStatisticsGame({totalCount, completedCount, percentCapacity}));

        await this.props.gameService.saveGame({
            transactions: completedCount
        });

        this.getDayTransactionCounts();
        this.getGameTransactionCounts();
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

    private getDayTransactionCounts = async() => {
        const response = await this.props.gameService.getDailyTransactionCounts();

        if(this._isMounted){
            this.setState({
                dayTransactionCounts: response
            })
        }
    };

    private getGameTransactionCounts = async () => {
        const response = await this.props.gameService.getGameTransactionCounts();

        if(this._isMounted){
            this.setState({
                gameTransactionCounts: response
            });
        }
    };

    private setConnection = async () => {
        this.props.dispatch(setStatusLoader(true));
        await this.props.transactionsService.setConnection();
        this.props.dispatch(setStatusLoader(false));
    };

    // TODO: clear timeout!

    private setTimerForSendTransaction = () => {
        this._timerId = setInterval(() => {
                const transactionCreatedLater = this.state.allTransactionCreated;

                setTimeout(() => {
                    const transactionCreatedNow = this.state.allTransactionCreated;
                    if (this._isMounted) {
                        const transactionPerSecond = transactionCreatedNow - transactionCreatedLater;
                        this.setState({
                            transactionPerSecond,
                        });

                        if (transactionPerSecond)
                            this.props.wsService.sendInfo(transactionPerSecond);
                    }
                }, 1000);
        }, 1000);
    };

    componentDidMount() {
        this._isMounted = true;

        this.props.wsService.webSocket();

        this.setConnection();
        this.setTimerForSendTransaction();
        document.addEventListener('keyup', (event) => {
            this.makeTransaction();
        });
    }

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<{}>, snapshot?: any): void {
        this.updateScroll()
    }

    componentWillUnmount() {
        this._isMounted = false;
        clearInterval(this._timerId);
        this.tryAgain();
    }

    render() {
        const transactions = this.props.transactionState.transactions;
        const gameStatus = this.props.gameState.status;
        const {totalCount, completedCount, percentCapacity} = this.props.gameState.statistics;

        const tps = this.props.transactionState.transactionsPerSecond;

        return (
            <div className={'game-wrapper'}>
                <div className={'container'}>
                    <div className={'play-zone-wrapper'}>
                        <div className={'timer'}>
                            <p>Transactions Created</p>
                            <p>{transactions.length}</p>
                        </div>
                        <div className={'counter'}>
                            <p>Transactions Confirmed</p>
                            <p>{completedCount}</p>
                        </div>
                        <div className={'capacity'}>
                            <p>Solana Capacity Used</p>
                            <p> %</p>
                        </div>
                        <div className={'speed'}>
                            <p>Transactions per Second</p>
                            <p>{tps}</p>
                        </div>

                        <div className={`square-container-wrapper`}>
                            <div id={'scroll-square-container'}
                                 className={`square-container`}
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
                        </div>

                        <button className={`click-zone`} onClick={this.makeTransaction}>
                            <div className={'tap-icon-wrapper'}>
                                <img src="../../../shared/images/icons/tap.svg" alt="tap"/>
                                <p>tap <br/> here</p>
                            </div>
                           <p className={'info'}>Or use keyboard button</p>
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}

const mapServicesToProps = ({transactionsService, gameService, wsService}: IService) => ({transactionsService, gameService, wsService});

const mapStateToProps = ({transactionState, gameState}: IRootAppReducerState) => ({transactionState, gameState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
    withService(mapServicesToProps)(Game)
);