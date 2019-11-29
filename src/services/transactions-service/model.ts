export interface ITransactionsService {
    makeTransaction(id: string): Promise<TransactionInfoService>,
}

export interface TransactionInfoService {
    description: string
}
