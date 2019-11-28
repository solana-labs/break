import * as React from 'react';
import {Dispatch} from "redux";
import {connect} from "react-redux";

import './index.scss';
import ITransaction from "../../../reducers/transactions/model";
import {IRootAppReducerState} from "../../../reducer/model";
import {addTransaction} from "../../../actions/add-tarnsaction";
import {IService} from "../../../services/model";
import {withService} from "../../hoc-helpers/with-service";

interface IDispatchProps {
    dispatch: Dispatch
}

interface IStateProps {
    transactionState: ITransaction.ModelState;
}

interface IServiceProps {
    swapiService: any
}

type IProps = IStateProps & IDispatchProps & IServiceProps;

class Game extends React.Component<IProps, {}> {

    private handlerClick = () =>{
        this.props.dispatch(addTransaction())
    };

    render() {
        const transactions = this.props.transactionState && this.props.transactionState.transactions;

        return (
            <div className={'game-wrapper'}>
                <h1>Game</h1>
                <div className={'square-container'} onClick={this.handlerClick}>
                    {transactions && transactions.map((item: ITransaction.Model) => (
                        <div key={item.id} className={'square'}/>
                    ))}
                </div>
            </div>
        )
    }
}

const mapServicesToProps = ({swapiService} : IService) => ({swapiService});

const mapStateToProps = ( {transactionState}: IRootAppReducerState) => ({transactionState});

export default connect<IStateProps, IDispatchProps, {}>(mapStateToProps as any)(
    withService(mapServicesToProps)(Game)
);



