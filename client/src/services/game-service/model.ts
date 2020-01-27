export interface IGameService {
  saveGame(data: any): Promise<any>;
  getDailyGameCounts(): any;
  getDailyTransactionCounts(): any;
  getGameTransactionCounts(): any;
}
