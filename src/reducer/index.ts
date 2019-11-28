import {IRootAppReducerState} from "./model";
import transactionReducer from "../reducers/transactions";

const rootAppReducer = (state: IRootAppReducerState = {} as IRootAppReducerState, action: any) => {
    return {
        transactionState: transactionReducer(state.transactionState, action),
    }
};

export default rootAppReducer;
