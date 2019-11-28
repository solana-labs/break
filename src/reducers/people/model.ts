import {Maybe} from "../../toolbox/custom-types";

namespace IPeople {
    export interface GetPeopleAPI {
        name: string;
        mass: string;
    }

    export interface Model {
        name: Maybe<string>;
        mass: Maybe<string>;

    }
}

export default IPeople;
