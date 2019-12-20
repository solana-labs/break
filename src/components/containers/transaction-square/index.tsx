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
            const {confirmationTime, signature, lamportsCount} = this.props.information;
            const solCount = lamportsCount / 1000000000;

            return <div className={'square-info-container'}>
                <p>Confirmation Time: {confirmationTime} sec</p>
                <p>SOL: {solCount}</p>
                <p>Signature: {signature}</p>
            </div>
        } else return <div/>
    };

    private setAnimation = () => {
        const animatedArray = ['zoomInRight', 'slideInRight', 'fadeInRight', 'slideInRight', 'bounceInRight', 'lightSpeedIn'];
        const index = Math.floor(Math.random() * Math.floor(6));

        this.animatedClass = animatedArray[index];
    };

    render() {
        const {gameStatus, status} = this.props;
        const {signature} = this.props.information;
        const hovered = this.state.popoverOpen ? 'hovered' : '';

        return (
          <Popover
            className={'square-popover-wrapper'}
            body={this.squareInfo()}
            children={<a
              key={0}
              href={`https://explorer.solana.com/transactions/${signature}`}
              target={'_blank'}
              onMouseOver={() => this.toggle(true)}
              onMouseOut={() => this.toggle(false)}
              className={`square ${status} ${gameStatus} ${hovered} ${this.animatedClass}`}
            />}
            isOpen={this.state.popoverOpen}
            enterExitTransitionDurationMs={5}
            preferPlace={'right'}
          />
        );
    }
}