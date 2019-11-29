import ITransaction from "../reducers/transactions/model";
import IGame from "../reducers/game/model";

export interface IRootAppReducerState {
    transactionState: ITransaction.ModelState,
    gameState: IGame.ModelState
}
