import {IRootAppReducerState} from "./model";
import peopleReducer from "../reducers/people";

const rootAppReducer = (state: IRootAppReducerState = {} as IRootAppReducerState, action: any) => {
    return {
        people: peopleReducer(state.people, action),
    }
};

export default rootAppReducer;
