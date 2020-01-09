import TransactionsService from "./transactions-service";
import {IService} from "./model";
import GameService from "./game-service";
import DefaultWebSocketService from "./web-socket";

export default class Service implements IService {
    public transactionsService = new TransactionsService();
    public gameService = new GameService();
    public wsService = new DefaultWebSocketService();
}