import {ITransactionsService} from "./transactions-service/model";
import {IGameService} from "./game-service/model";

export interface IService {
    transactionsService: ITransactionsService
    gameService: IGameService
}
