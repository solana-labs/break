export type Error = {
  msg: string;
};

export type Status = "sent" | "success" | "timeout" | Error;
export interface Model {
  status: Status;
  info: Info;
}

export interface Info {
  accountId: string;
  signature: string;
  confirmationTime: number;
  userSent: boolean;
}

export interface ModelState {
  transactions: Model[];
  allCompletedCount: number;
  userCompletedCount: number;
  transactionsPerSecond: number;
}
