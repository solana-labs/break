import {ITransactionsService} from "./transactions-service/model";
import {IGameService} from "./game-service/model";
import {IDefaultWebSocketService} from "./web-socket/model";

export interface IService {
    transactionsService: ITransactionsService
    gameService: IGameService
    wsService: IDefaultWebSocketService
}
