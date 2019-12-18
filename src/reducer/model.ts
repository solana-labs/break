import ITransaction from "../reducers/transactions/model";
import IGame from "../reducers/game/model";
import IUsers from "../reducers/users/model";

export interface IRootAppReducerState {
    transactionState: ITransaction.ModelState,
    gameState: IGame.ModelState
    usersState: IUsers.ModelState
}
