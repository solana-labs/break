import IPeople from "./model";
import {GET_PEOPLE} from "../../actions/types";

const initState: IPeople.Model = {
    name: null,
    mass: null
};

const peopleReducer = (state = initState, action: any) => {
    switch (action.type) {
        case GET_PEOPLE:
            return {
                ...state,
                ...action.payload
            }
        default:
            return state;
    }
};

export default peopleReducer;
