import { TransactionService, ITransactionService } from "./transaction";

export interface IService {
  transactionService: ITransactionService;
}

export default class Service implements IService {
  public transactionService = new TransactionService();
}
