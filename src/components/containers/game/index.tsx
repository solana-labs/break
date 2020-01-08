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
import {setStatisticsGame} from "../../../actions/set-statistics-game";
import {resetStatisticsGame} from "../../../actions/reset-statistics-game";
import {resetTransactions} from "../../../actions/reset-tarnsactions";
import {Button} from "../../ui/button";
import {StartHead} from "../../presentational/start-head";
import FinishHead from "../../presentational/finish-head";
import {IGameService} from "../../../services/game-service/model";
import {GlobalStatisticsBoard} from "../../presentational/global-statistics-board";
import {setStatusLoader} from "../../../actions/set-status-loader";

interface IDispatchProps {
    dispatch: Dispatch
}

interface IStateProps {
    transactionState: ITransaction.ModelState;
}

interface IServiceProps {
    transactionsService: ITransactionsService
    gameService: IGameService
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {
    _isMounted = false;

    private makeTransaction = async () => {
        const transactions = this.props.transactionState.transactions;

        const totalCount: number = transactions.length;
        const id = 'transaction' + totalCount;

        this.props.dispatch(addTransaction());

        const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(totalCount);

        const updatedTransaction: ITransaction.Model = {
            id, info, status: 'completed',
        };

        this.props.dispatch(setTransactionInfo(updatedTransaction));

        const completedCount = this.props.transactionState.countCompletedTransactions;
        const percentCapacity = parseFloat(((completedCount / (50000 * 15)) * 100).toFixed(4));
        this.props.dispatch(setStatisticsGame({totalCount, completedCount, percentCapacity}));
    };

    private updateScroll = () => {
        const scrollSquareContainer: HTMLElement | null = document.getElementById("scroll-square-container");
        if (scrollSquareContainer) {
            scrollSquareContainer.scrollTop = scrollSquareContainer.scrollHeight;
        }
    };

    private setConnection = async () => {
        this.props.dispatch(setStatusLoader(true));
        await this.props.transactionsService.setConnection();
        this.props.dispatch(setStatusLoader(false));
    };

    componentDidMount() {
        this._isMounted = true;

        this.setConnection();

        document.addEventListener('keyup', (event) => {
            this.makeTransaction();
        });
    }

    componentDidUpdate() {
        this.updateScroll()
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        const transactions = this.props.transactionState.transactions;
        const completedCount = this.props.transactionState.countCompletedTransactions;

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
                            <p> </p>
                        </div>

                        <div className={`square-container-wrapper`}>
                            <div id={'scroll-square-container'}
                                 className={`square-container`}
                                 tabIndex={0}
                            >
                                {transactions && transactions.map((item: ITransaction.Model) => (
                                    <TransactionSquare
                                        key={item.id}
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

const mapServicesToProps = ({transactionsService, gameService}: IService) => ({transactionsService, gameService});

const mapStateToProps = ({transactionState}: IRootAppReducerState) => ({transactionState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
    withService(mapServicesToProps)(Game)
);