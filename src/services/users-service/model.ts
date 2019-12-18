export interface IUsersService {
    getUserRecord(nickName: string): any
    getLeaderboard(limit: number): any
    saveRecord(): any
}

