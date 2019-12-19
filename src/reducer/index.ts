import {IRootAppReducerState} from "./model";
import transactionReducer from "../reducers/transactions";
import gameReducer from "../reducers/game";

const rootAppReducer = (state: IRootAppReducerState = {} as IRootAppReducerState, action: any) => {
    return {
        transactionState: transactionReducer(state.transactionState, action),
        gameState: gameReducer(state.gameState, action),
    }
};

export default rootAppReducer;
