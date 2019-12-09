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
    constructor(props: IProps) {
        super(props);
        this.setAnimation();
    }

    state: IState = {
        popoverOpen: false
    };

    animatedClass = '';

    private toggle = (toState: any = null) => {
        this.setState({popoverOpen: toState === null ? !this.state.popoverOpen : toState})
    };

    private squareInfo = () => {
        const {gameStatus, status} = this.props;

        if (gameStatus === 'finished' && status === 'completed') {
            const {confirmationTime, signature} = this.props.information;

            return <div className={'square-info-container'}>
                <p>{`Confirmation Time: ${confirmationTime} sec`}</p>
                <p>{`Lamports: `}</p>
                <p>{`Signature: ${signature}`}</p>
            </div>
        } else return <div/>
    };

    private setAnimation = () => {
        const animatedArray = ['zoomInRight', 'zoomInRight', 'fadeInRight', 'fadeInRight', 'lightSpeedIn', 'lightSpeedIn'];
        const index = Math.floor(Math.random() * Math.floor(6));

        this.animatedClass = animatedArray[index];
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
              className={`square ${this.props.status} ${hovered} animated ${this.animatedClass}`}
            />}
            isOpen={this.state.popoverOpen}
            enterExitTransitionDurationMs={5}
            preferPlace={'right'}
          />
        );
    }
}