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
import ModalPortal from "../../ui/modal-portal";
import BuildOnSolanaPopup from "../build-on-solana-popup";
import {StartHead} from "../../presentational/start-head";
import FinishHead from "../../presentational/finish-head";
import LeaderBoard from "../leaderboard";
import IUsers from "../../../reducers/users/model";
import {IUsersService} from "../../../services/users-service/model";
import {setUserRecord} from "../../../actions/set-user-record";

interface IDispatchProps {
    dispatch: Dispatch
}

interface IStateProps {
    transactionState: ITransaction.ModelState;
    gameState: IGame.ModelState;
    usersState: IUsers.ModelState;
}

interface IServiceProps {
    transactionsService: ITransactionsService
    usersService: IUsersService
}

interface IState {
    secondsCount: number,
    buildPopupIsOpen: boolean,
    recordNumber: number
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {
    _isMounted = false;

    private refSquareContainer = React.createRef<HTMLDivElement>();

    state: IState = {
        secondsCount: 15,
        buildPopupIsOpen: false,
        recordNumber: 0,
    };

    // private setUserInfo = () => {
    //     const user = this.props.usersState.userRecord;
    //
    //     const randomName = 'randomName';
    //     const localNickname = localStorage.getItem('nickname');
    //
    //     const localOrRandom = localNickname ? localNickname : randomName;
    //     const nickname = user && user.nickname ? user.nickname : localOrRandom;
    //
    //     const userRecord: IUsers.Model = {
    //         nickname: nickname,
    //         record: 0
    //     };
    //     this.props.dispatch(setUserRecord(userRecord));
    // };
    //
    // private getUserRecord = async () => {
    //     let name = this.props.usersState.userRecord && this.props.usersState.userRecord.nickname;
    //
    //     if (!name) {
    //         name = localStorage.getItem('nickname');
    //     }
    //
    //     if (!name) return;
    //
    //     try {
    //         const response = await this.props.usersService.getUserRecord(name);
    //         const userRecord: IUsers.Model = {
    //             nickname: name,
    //             record: response
    //         };
    //         this.props.dispatch(setUserRecord(userRecord))
    //     } catch (err) {
    //         console.error(err);
    //     }
    // };

    private getUserInfo = async () => {
        let nickname = this.props.usersState.userRecord && this.props.usersState.userRecord.nickname;

        if (!nickname) {
            nickname = localStorage.getItem('nickname');
        }

        if (!nickname) {
            nickname = 'RandomName';
        }

        const userRecord: IUsers.Model = {
            nickname,
            record: 0,
        };

        try {
            const newRecord = await this.props.usersService.getUserRecord(nickname);
            userRecord.record = newRecord;

            this.setState({
                recordNumber: newRecord
            });
        }
        catch (err) {
            console.log('error - ', err);
        }

        this.props.dispatch(setUserRecord(userRecord))
    };

    private makeTransaction = async () => {
        const transactions = this.props.transactionState.transactions;
        let status = this.props.gameState.status;
        if (status !== 'started') return;

        const countOfTransactions = transactions.length;
        const id = 'transaction' + countOfTransactions;

        this.props.dispatch(addTransaction());

        const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(id);

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

        this.saveRecord(completedCount);
    };

    private saveRecord = async (newRecord: number) => {
        const { recordNumber } = this.state;
        const nickname = localStorage.getItem('nickname');

        if (!nickname || newRecord <= recordNumber) return;

        const userRecord: IUsers.ModelAPI = {
            nickname: nickname,
            record: newRecord,
        };

        this.props.usersService.saveRecord(userRecord);
        this.props.dispatch(setUserRecord(userRecord))
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

    private openPopup = () => {
        this.setState({
            buildPopupIsOpen: true
        })
    };

    private closePopup = () => {
        this.setState({
            buildPopupIsOpen: false
        })
    };

    private updateScroll = () => {
        const scrollSquareContainer: HTMLElement | null = document.getElementById("scroll-square-container");
        if (scrollSquareContainer) {
            scrollSquareContainer.scrollTop = scrollSquareContainer.scrollHeight;
        }
    };

    componentDidMount() {
        this._isMounted = true;
        // this.setUserInfo();
        // this.getUserRecord();
        this.getUserInfo();
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
        const userRecord = this.props.usersState.userRecord;

        // console.log('userRecord', userRecord)

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
                            openPopup={this.openPopup}
                        />
                        :
                        <StartHead
                            secondsCount={secondsCount}
                            transactionsCreated={transactions.length}
                            averageTransactionsTime={averageTransactionsTime}
                            myTopResult={userRecord ? userRecord.record : 0}
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
                        <LeaderBoard/>
                    </div>
                </div>

                <ModalPortal isOpenProps={this.state.buildPopupIsOpen} onClose={this.closePopup}>
                    <BuildOnSolanaPopup onClose={this.closePopup}/>
                </ModalPortal>
            </div>
        )
    }
}

const mapServicesToProps = ({transactionsService, usersService}: IService) => ({transactionsService, usersService});

const mapStateToProps = ({transactionState, gameState, usersState}: IRootAppReducerState) => ({transactionState, gameState, usersState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
    withService(mapServicesToProps)(Game)
);