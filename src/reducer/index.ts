import {IRootAppReducerState} from "./model";
import transactionReducer from "../reducers/transactions";
import gameReducer from "../reducers/game";
import loaderReducer from "../reducers/loader";

const rootAppReducer = (state: IRootAppReducerState = {} as IRootAppReducerState, action: any) => {
    return {
        transactionState: transactionReducer(state.transactionState, action),
        gameState: gameReducer(state.gameState, action),
        loaderState: loaderReducer(state.loaderState, action)
    }
};

export default rootAppReducer;
