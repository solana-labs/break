export interface IGameService {
    getDailyTransactionCounts(): any
    getGameTransactionCounts(): any
    saveGame(data: any): Promise<any>
}


