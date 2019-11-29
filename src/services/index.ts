import SwapiService from "./swapi-service";
import TransactionsService from "./transactions-service";
import {IService} from "./model";

class Service implements IService {
    public swapiService = new SwapiService();
    public transactionsService = new TransactionsService();
}

const service = new Service();

export default service;
