import * as React from 'react';
import {connect} from 'react-redux';

import {IMapServicesToProps, withService} from "../../hoc-helpers/with-service";
import {IService} from "../../../services/model";
import {ISwapiService} from "../../../services/swapi-service/model";

import './index.scss';
import {IRootAppReducerState} from "../../../reducer/model";
import IPeople from "../../../reducers/people/model";
import {Dispatch} from "redux";
import {getPeople} from "../../../actions/get-people";

interface IProps {
    swapiService: ISwapiService;
    people: IPeople.Model;
    dispatch: Dispatch
}

class SwapiInfo extends React.Component<IProps, {}> {
    componentDidMount() {
        this.getPeople();
    }

    private getPeople = async() => {
        try {
            const result = await this.props.swapiService.getPeople(5);

            this.props.dispatch(getPeople(result));
        } catch (err) {
            console.error(err);
        }
    };

    render() {
        const {people: { name, mass }} = this.props;

        if(mass && name) {
            return (
                <div className='swapi-info-component'>{name} - {mass}</div>
            )
        }

        return(
            <div className='swapi-info-component'>Loading...</div>
        )
    }
}

const mapServicesToProps: IMapServicesToProps = ({ swapiService }: IService) => ({ swapiService });

const mapStateToProps = ({ people }: IRootAppReducerState) => ({ people });

export default connect(mapStateToProps)(
    withService(mapServicesToProps)(SwapiInfo)
);
