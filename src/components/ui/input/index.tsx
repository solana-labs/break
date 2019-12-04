import * as React from 'react';

import './index.scss';

interface IProps {
    placeholder?: string
    value?: string;
    title: string,
    id?: number,
    isValid?: boolean
    inputValueFunc(value: string): void;
    onBlur?(): void;
    onFocus?(): void;
}

interface IState {
    value: string
}

export default class InputComponent extends React.Component<IProps, IState> {
    private handleChange = (event: any) => {
        this.props.inputValueFunc(event.target.value)
    };

    render() {

        const {placeholder, title, value, isValid, onFocus, onBlur} = this.props;

        return (
            <div className={`input-component ${!isValid ? 'error':''}`}>
                <input
                    type="text"
                    placeholder={placeholder}
                    onChange={this.handleChange}
                    title={title}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    value={value ? value : ''}
                />
            </div>
        );
    }
}

