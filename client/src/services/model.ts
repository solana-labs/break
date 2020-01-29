import { ITransactionsService } from "./transactions-service/model";
import { IDefaultWebSocketService } from "./web-socket/model";

export interface IService {
  transactionsService: ITransactionsService;
  wsService: IDefaultWebSocketService;
}
