import * as React from 'react';

import './index.scss';

interface IProps {
    placeholder?: string;
    value?: string;
    id?: number;
    isValid?: boolean;
    color?: string;
    inputValueFunc(value: string): void;
    onBlur?(): void;
    onFocus?(): void;
}

interface IState {
    focused: boolean;
}

export default class InputComponent extends React.Component<IProps, IState> {

    state: IState = {
        focused: false
    };

    private onFocus = () => {
        this.setState({
            focused: !this.state.focused
        })
    };

    private onBlur = () => {
        this.setState({
            focused: !this.state.focused
        })
    };


    private handleChange = (event: any) => {
        this.props.inputValueFunc(event.target.value)
    };

    render() {

        const {placeholder, value, isValid, onFocus, onBlur, color} = this.props;

        return (
            <div className={`input-component ${!isValid ? 'error':''} ${color} ${this.state.focused ? 'focused': ''}`}>
                <input
                    type="text"
                    placeholder={placeholder}
                    onChange={this.handleChange}
                    onBlur={onBlur ? onBlur : this.onBlur}
                    onFocus={onFocus ? onFocus : this.onFocus}
                    value={value ? value : ''}
                />
            </div>
        );
    }
}

