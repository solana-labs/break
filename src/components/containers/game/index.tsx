import * as React from 'react';
import {Dispatch} from "redux";
import {connect} from "react-redux";
import {FacebookShareButton, TwitterShareButton} from 'react-share';
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
import {ButtonAnimate} from "../../ui/button-animate";
import {setStatusGame} from "../../../actions/set-status-game";
import {setStatisticsGame} from "../../../actions/set-statistics-game";
import {resetStatisticsGame} from "../../../actions/reset-statistics-game";
import {resetTransactions} from "../../../actions/reset-tarnsactions";
import {Button} from "../../ui/button";
import ModalPortal from "../../ui/modal-portal";
import BuildOnSolanaPopup from "../build-on-solana-popup";

const shareTwitterIcon = require('../../../shared/images/share-twitter.svg');
const shareFacebookIcon = require('../../../shared/images/share-facebook.svg');

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
    secondsCount: number,
    buildPopupIsOpen: boolean
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {
    _isMounted = false;

    state: IState = {
        secondsCount: 15,
        buildPopupIsOpen: false,
    };

    private makeTransaction = async () => {
        let status = this.props.gameState.status;
        if (status !== 'started') return;

        const countOfTransactions = this.props.transactionState.transactions.length;
        const id = 'transaction' + countOfTransactions;

        this.props.dispatch(addTransaction());

        const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(id);
        const updatedTransaction: ITransaction.Model = {
            id, info, status: 'completed',
        };

        status = this.props.gameState.status;
        if (status !== 'started') return;

        this.props.dispatch(setTransactionInfo(updatedTransaction));
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

        const percentCapacity = parseFloat((completedCount / 50000).toFixed(3));

        this.props.dispatch(setStatisticsGame({totalCount, completedCount, percentCapacity}))
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

    componentDidMount() {
        this._isMounted = true;

        this.props.transactionsService.setConnection();
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.tryAgain();
    }

    render() {
        const transactions = this.props.transactionState.transactions;
        const gameStatus = this.props.gameState.status;
        const {totalCount, completedCount, percentCapacity} = this.props.gameState.statistics;
        const {secondsCount} = this.state;

        return (
          <div className={'game-wrapper'}>
              <div className={'container'}>
                  <div className={'head-block'}>
                      {gameStatus === 'finished' ?
                        <div className={'finished-head'}>
                            <div className={'stats-block'}>
                                <p>Stats: </p>
                                <p>{`Transaction(s) processed: ${completedCount} of ${totalCount}`}</p>
                                <p>{`${percentCapacity}% of Solana capacity used`}</p>
                                <Button typeButton={true} name={'Try Again'} onClick={this.tryAgain}/>
                            </div>
                            <div className={'info-block'}>
                                <p>{`Well, perhaps if you invited a fem more friends... With ${completedCount} transactions in 15 seconds you took up ${percentCapacity}% of our blockchain's network capabilities. If you invited couple more people our decentralized database would start to slow down. You can review every transaction with stats on confirmation and signatures hovering it.`}</p>
                            </div>
                            <div className={'share-block'}>
                                <p>Share your result:</p>
                                <div className={'share-buttons-wrapper'}>
                                    <TwitterShareButton
                                      className={'share-button'}
                                      title={`My results breaking Solana: \nTotal transactions: ${totalCount} \nSolana capacity used: ${percentCapacity}% \n\nYou can try to break Solana by your own`}
                                      url={'https://break.solana.com/'}>
                                        <img src={shareTwitterIcon}/>
                                    </TwitterShareButton>
                                    <FacebookShareButton
                                      className={'share-button'}
                                      quote={`My results breaking Solana: \nTotal transactions: ${totalCount} \nSolana capacity used: ${percentCapacity}% \n\nYou can try to break Solana by your own`}
                                      url={'https://break.solana.com/'}>
                                        <img src={shareFacebookIcon}/>
                                    </FacebookShareButton>
                                </div>
                                <Button typeButton={true} name={'Build on Solana'} onClick={this.openPopup}/>
                            </div>
                        </div> :
                        <div className={'unstarted-head'}>
                            <div className={'timer'}>
                                <p>{`${secondsCount} seconds`}</p>
                            </div>
                            <div className={'counter'}>
                                <p>Transactions created: {transactions.length}</p>
                            </div>
                        </div>
                      }
                  </div>
                  {gameStatus === 'unstarted' ?
                    <div className={'start-button-block'}>
                        <ButtonAnimate name={'Begin'} onClick={this.startGame}/>
                    </div> :
                    <div className={'square-container'} onClick={this.makeTransaction}>
                        {transactions && transactions.map((item: ITransaction.Model) => (
                          <TransactionSquare gameStatus={gameStatus} status={item.status} key={item.id}
                                             information={item.info}/>
                        ))}
                    </div>
                  }
              </div>


              <ModalPortal isOpenProps={this.state.buildPopupIsOpen} onClose={this.closePopup}>
                  <BuildOnSolanaPopup onClose={this.closePopup}/>
              </ModalPortal>
          </div>
        )
    }
}

const mapServicesToProps = ({transactionsService}: IService) => ({transactionsService});

const mapStateToProps = ({transactionState, gameState}: IRootAppReducerState) => ({transactionState, gameState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
  withService(mapServicesToProps)(Game)
);