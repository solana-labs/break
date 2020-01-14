import * as React from 'react';
import {Dispatch} from "redux";
import {connect} from "react-redux";

import './index.scss';
import ITransaction from "../../../reducers/transactions/model";
import TransactionSquare from "../transaction-square";
import {IRootAppReducerState} from "../../../reducer/model";
import {addTransaction} from "../../../actions/add-tarnsaction";
import {setTransactionInfo} from "../../../actions/set-transaction-info";
import {IService} from "../../../services/model";
import {withService} from "../../hoc-helpers/with-service";
import {ITransactionsService, TransactionInfoService} from "../../../services/transactions-service/model";
import {IGameService} from "../../../services/game-service/model";
import {setStatusLoader} from "../../../actions/set-status-loader";
import {IDefaultWebSocketService} from "../../../services/web-socket/model";
import {FacebookShareButton, TwitterShareButton} from "react-share";

const tapIcon = require('../../../shared/images/icons/tap.svg');
const shareTwitterIcon = require('../../../shared/images/share-twitter.svg');
const shareFacebookIcon = require('../../../shared/images/share-facebook-2.svg');

interface IDispatchProps {
    dispatch: Dispatch
}

interface IStateProps {
    transactionState: ITransaction.ModelState;
}

interface IServiceProps {
    transactionsService: ITransactionsService
    gameService: IGameService
    wsService: IDefaultWebSocketService
}

interface IState {
    allTransactionConfirmed: number,
    transactionPerSecond: number
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {
    _isMounted = false;
    _timerId: any;
    _timeoutId: any;

    state: IState = {
        allTransactionConfirmed: 0,
        transactionPerSecond: 0
    };

    private makeTransaction = async () => {
        this.updateScroll();

        const transactions = this.props.transactionState.transactions;

        const totalCount: number = transactions.length;
        const id = 'transaction' + totalCount;

        this.props.dispatch(addTransaction());

        // const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(totalCount);

        try {
            const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(totalCount);
            const updatedTransaction: ITransaction.Model = {
                id, info, status: 'completed',
            };

            if (this._isMounted) {
                this.setState({
                    allTransactionConfirmed: this.state.allTransactionConfirmed + 1,
                })
            }

            this.props.dispatch(setTransactionInfo(updatedTransaction));
        } catch (e) {
            console.log(e);
        }
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

    private setTimerForSendTransaction = () => {
        this._timerId = setInterval(() => {
                const transactionConfirmedLater = this.state.allTransactionConfirmed;

                this._timeoutId = setTimeout(() => {
                    const transactionConfirmedNow = this.state.allTransactionConfirmed;
                    if (this._isMounted) {
                        const transactionPerSecond = transactionConfirmedNow - transactionConfirmedLater;
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

    componentWillUnmount() {
        this._isMounted = false;
        clearInterval(this._timerId);
        clearTimeout(this._timeoutId);
    }

    render() {
        const transactions = this.props.transactionState.transactions;
        const completedCount = this.props.transactionState.countCompletedTransactions;
        const tps = this.props.transactionState.transactionsPerSecond;
        const percentCapacity = parseFloat(((tps / 50000) * 100).toFixed(4));

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
                            <p>{percentCapacity} %</p>
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
                                        status={item.status}
                                        information={item.info}
                                    />
                                ))}
                            </div>
                        </div>

                        <button className={`click-zone`} onClick={this.makeTransaction}>
                            <div className={'tap-icon-wrapper'}>
                                <img src={tapIcon} alt="tap"/>
                                <p>tap <br/> here</p>
                            </div>
                           <p className={'info'}>Or use keyboard button</p>
                        </button>
                    </div>
                    <div className={'share-block-wrapper'}>
                        <a className={'build-button'} target={'_blank'} href="https://solana.com/developers/">build on solana</a>
                        <div className={'share-block'}>
                            <TwitterShareButton
                                className={'share-button'}
                                title={`Currently, all players online are creating ${tps} TPS, which means they are using ${percentCapacity}% of Solana capacity. \n\nYou can join us and try to break Solana:`}
                                url={'https://break.solana.com/'}>
                                <img src={shareTwitterIcon}/>
                            </TwitterShareButton>
                            <FacebookShareButton
                                className={'share-button'}
                                quote={`Currently, all players online are creating ${tps} TPS, which means they are using ${percentCapacity}% of Solana capacity. \n\nYou can join us and try to break Solana:`}
                                url={'https://break.solana.com/'}>
                                <img src={shareFacebookIcon}/>
                            </FacebookShareButton>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const mapServicesToProps = ({transactionsService, gameService, wsService}: IService) => ({transactionsService, gameService, wsService});

const mapStateToProps = ({transactionState}: IRootAppReducerState) => ({transactionState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
    withService(mapServicesToProps)(Game)
);