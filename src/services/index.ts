import TransactionsService from "./transactions-service";
import {IService} from "./model";
import GameService from "./game-service";

class Service implements IService {
    public transactionsService = new TransactionsService();
    public gameService = new GameService();
}

const service = new Service();

export default service;
