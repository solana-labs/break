import {SET_STATUS_LOADER} from "../../actions/types";
import ILoader from "./model";

const initState: ILoader.Model = {
    isActive: false
};

const loaderReducer = (state = initState, action: any) => {

    switch (action.type) {
        case SET_STATUS_LOADER: {
            return {
                ...state,
                isActive: action.payload
            }
        }
        default:
            return state;
    }
};

export default loaderReducer;