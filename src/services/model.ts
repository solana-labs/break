import {ISwapiService} from "./swapi-service/model";
import {ITransactionsService} from "./transactions-service/model";

export interface IService {
    swapiService: ISwapiService,
    transactionsService: ITransactionsService
}
