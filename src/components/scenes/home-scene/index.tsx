import * as React from 'react';
import {Helmet} from 'react-helmet';

import './index.scss';
import ExampleInfo from "../../presentational/example-info";
import SwapiInfo from "../../containers/swapi-info";

export default class HomeScene extends React.Component {
    render() {
        return (
            <React.Fragment>
                <Helmet>
                    <title>Home Page</title>
                </Helmet>
                <div className='home-scene-component'>
                    <h2>HomePage</h2>
                    <ExampleInfo/>
                    <SwapiInfo/>
                </div>
            </React.Fragment>
        );
    }
}
