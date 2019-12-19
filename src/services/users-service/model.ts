import IUsers from "../../reducers/users/model";

export interface IUsersService {
    getUserRecord(nickname: string): any
    getLeaderboard(limit: number): any
    saveRecord(record: IUsers.ModelAPI): any
}

