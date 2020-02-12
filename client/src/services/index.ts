import { TransactionService } from "./transaction";

export interface IService {
  transactionService: TransactionService;
}

export default class Service implements IService {
  public transactionService = new TransactionService();
}
