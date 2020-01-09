import * as React from 'react';
import Service from "../../../services";

const {
    Provider: ServiceProvider,
    Consumer: ServiceConsumer
} = React.createContext(new Service());

export {
    ServiceProvider,
    ServiceConsumer
}
