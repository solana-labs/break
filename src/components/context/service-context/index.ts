import * as React from 'react';

import service from "../../../services";

const {
    Provider: ServiceProvider,
    Consumer: ServiceConsumer
} = React.createContext(service);

export {
    ServiceProvider,
    ServiceConsumer
}
