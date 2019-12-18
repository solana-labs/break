import * as React from 'react';

import './index.scss';
import {CloseImage} from "../../ui/close-image";
import InputComponent from "../../ui/input";
import {Button} from "../../ui/button";
import validationSet from "../../../utils/validation-set";


interface IProps {
    onClose(): void
}

interface IState {
    email: string,
    isValid: boolean
}

export default class BuildOnSolanaPopup extends React.Component<IProps, IState> {

    state: IState = {
        email: '',
        isValid: true
    };

    private inputValueFunc = (value: string) => {
        this.setState({
            email: value
        });
    };

    private emailValidation = (value: string) => {
        if(!validationSet.email(value)){
            this.setState({
                email: 'Enter a Valid Email Address',
                isValid: false
            });
        }
    };

    private onSend = () => {
        this.emailValidation(this.state.email)
    };

    private onFocus = () => {
        if(!this.state.isValid){
            this.setState({
                email: '',
                isValid: true
            });
        }
    };

    componentWillUnmount(): void {
        this.setState({
            email: '',
            isValid: true
        });
    }

    render() {
        return (
            <div className={'build-on-solana-popup-popup'}>
                <CloseImage onClick={this.props.onClose}/>
                <h2 className={'title'}>Build on Solana</h2>
                <p className={'input-title'}>Your Email</p>
                <div className={'input-button-block'}>
                    <InputComponent
                        inputValueFunc={this.inputValueFunc}
                        value={this.state.email}
                        isValid={this.state.isValid}
                        onFocus={this.onFocus}
                    />
                    <Button typeButton={true} name={'Send'} onClick={this.onSend}/>
                </div>
            </div>
        );
    }
}
