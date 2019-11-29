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

interface IDispatchProps {
    dispatch: Dispatch
}

interface IStateProps {
    transactionState: ITransaction.ModelState;
}

interface IServiceProps {
    transactionsService: ITransactionsService
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {

    private handlerClick = async () =>{
        const countOfTransactions = this.props.transactionState.transactions.length;
        const id = 'transaction' + countOfTransactions;

        this.props.dispatch(addTransaction());

        const info: TransactionInfoService = await this.props.transactionsService.makeTransaction(id);
        const updatedTransaction: ITransaction.Model = {
            id, info, status: 'completed',
        };

        this.props.dispatch(setTransactionInfo(updatedTransaction));
    };

    render() {
        const transactions = this.props.transactionState && this.props.transactionState.transactions;

        console.log('new transactions - ', transactions);

        return (
            <div className={'game-wrapper'}>
                <h1>Game</h1>
                <div className={'square-container'} onClick={this.handlerClick}>
                    {transactions && transactions.map((item: ITransaction.Model) => (
                        <div key={item.id} className={`square ${item.status}`}/>
                    ))}
                </div>
            </div>
        )
    }
}

const mapServicesToProps = ({transactionsService} : IService) => ({transactionsService});

const mapStateToProps = ( {transactionState}: IRootAppReducerState) => ({transactionState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
    withService(mapServicesToProps)(Game)
);



