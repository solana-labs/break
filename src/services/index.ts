import TransactionsService from "./transactions-service";
import UsersService from "./users-service";
import {IService} from "./model";

class Service implements IService {
    public transactionsService = new TransactionsService();
    public usersService = new UsersService();
}

const service = new Service();

export default service;
