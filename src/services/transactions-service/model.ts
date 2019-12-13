export interface ITransactionsService {
    makeTransaction(id: string): Promise<TransactionInfoService>,
    setConnection(): void
}

export interface TransactionInfoService {
    signature: string
    confirmationTime: number
    lamportsCount: number
}
