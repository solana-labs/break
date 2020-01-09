import React from 'react';
import ReactDOM from 'react-dom';

import {BrowserRouter} from 'react-router-dom';
import {Provider} from 'react-redux';

import '@styles/global.scss';

import App from './app';
import appStore from "./store";
import Service from "./services";
import {ServiceProvider} from "./components/context/service-context";
import {HelmetSet} from "./components/presentational/helmet-set";

const service = new Service();

ReactDOM.render((
    <Provider store={appStore}>
        <ServiceProvider value={service}>
            <BrowserRouter>
                <HelmetSet/>
                <App/>
            </BrowserRouter>
        </ServiceProvider>
    </Provider>
), document.getElementById('root'));