export interface ITransactionsService {
    makeTransaction(id: number): Promise<TransactionInfoService>,
    setConnection(): void
}

export interface TransactionInfoService {
    signature: string
    confirmationTime: number
    lamportsCount: number
}
