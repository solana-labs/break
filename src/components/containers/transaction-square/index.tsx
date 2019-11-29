import * as React from 'react';
import './index.scss';
import ITransaction from "../../../reducers/transactions/model";

interface IProps {
    status: string
    information: ITransaction.TransactionInfo
}

export default class TransactionSquare extends React.Component<IProps, {}> {

    render() {
        return (
          <div className={`square ${this.props.status} zoomInRight animated `}/>
        );
    }
}


