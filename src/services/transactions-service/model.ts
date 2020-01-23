export interface ITransactionsService {
    makeTransaction(id: number): Promise<TransactionServiceInfo>;
    initialize(): Promise<void>;
}

export interface TransactionServiceInfo {
    signature: string;
    confirmationTime: number;
    lamportsCount: number;
}
