import * as ITransaction from "../reducers/transactions/model";
import * as IGame from "../reducers/game/model";
import * as ILoader from "../reducers/loader/model";

export interface IRootAppReducerState {
  transactionState: ITransaction.ModelState;
  gameState: IGame.ModelState;
  loaderState: ILoader.ModelState;
}
