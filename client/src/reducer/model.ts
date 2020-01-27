import ITransaction from "../reducers/transactions/model";
import IGame from "../reducers/game/model";
import ILoader from "../reducers/loader/model";

export interface IRootAppReducerState {
  transactionState: ITransaction.ModelState;
  gameState: IGame.ModelState;
  loaderState: ILoader.ModelState;
}
