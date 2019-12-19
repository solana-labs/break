import TransactionsService from "./transactions-service";
import {IService} from "./model";

class Service implements IService {
    public transactionsService = new TransactionsService();
}

const service = new Service();

export default service;
