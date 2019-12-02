import * as React from 'react';

import './index.scss';
import ITransaction from "../../../reducers/transactions/model";
import Popover from "react-popover";

interface IProps {
    status: string
    information: ITransaction.TransactionInfo
    gameStatus: string
}

interface IState {
    popoverOpen: boolean
}

export default class TransactionSquare extends React.Component<IProps, IState> {

    state: IState = {
        popoverOpen: false
    };

    private toggle = (toState: any = null) => {
        this.setState({popoverOpen: toState === null ? !this.state.popoverOpen : toState})
    };

    private squareInfo = () => {
        if (this.props.gameStatus === 'finished') {
            return <div className={'square-info-container'}>
                <p>Confirmation Time: 1.2 sec</p>
                <p>Lamports: .00000001</p>
                <p>Signature: ds33jahfda213534shfidsh13</p>
            </div>
        } else return <div/>
    };

    render() {
        const hovered = this.state.popoverOpen ? 'hovered' : '';
        return (
            <Popover
                className={'square-popover-wrapper'}
                body={this.squareInfo()}
                children={<div
                    key={0}
                    onMouseOver={() => this.toggle(true)}
                    onMouseOut={() => this.toggle(false)}
                    className={`square ${this.props.status} ${hovered} animated zoomInRight`}
                />}
                isOpen={this.state.popoverOpen}
                enterExitTransitionDurationMs={5}
                preferPlace={'right'}
            />
        );
    }
}


