import TransactionsService from "./transactions-service";
import { IService } from "./model";
import DefaultWebSocketService from "./web-socket";

export default class Service implements IService {
  public transactionsService = new TransactionsService();
  public wsService = new DefaultWebSocketService();
}
