export interface Model {
  id: string;
  status: string;
  info: TransactionInfo;
}

export interface TransactionInfo {
  signature: string;
  confirmationTime: number;
  lamportsCount: number;
}

export interface ModelState {
  transactions: Model[];
  countCompletedTransactions: number;
  averageTransactionsTime: number;
  transactionsPerSecond: number;
}
