import * as React from 'react';

import {IService} from "../../../services/model";
import {ServiceConsumer} from "../../context/service-context";

export interface IMapServicesToProps {
    (service: IService): Partial<IService>;
}

export const withService = (mapServicesToProps: IMapServicesToProps) => (Wrapped: any) => {
    /* eslint-disable react/display-name */
    return (props: any) => {
        return (
            <ServiceConsumer>
                {
                    (service: IService) => {
                        const servicesProps = mapServicesToProps(service);

                        return <Wrapped {...props} {...servicesProps}/>;
                    }
                }
            </ServiceConsumer>
        )
    }
};
