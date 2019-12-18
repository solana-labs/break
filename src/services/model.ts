import {ITransactionsService} from "./transactions-service/model";
import {IUsersService} from "./users-service/model";

export interface IService {
    transactionsService: ITransactionsService
    usersService: IUsersService
}
