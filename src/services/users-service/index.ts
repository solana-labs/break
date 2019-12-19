import {IUsersService} from "./model";
import {IFetcher} from "../../api/fetcher/model";
import {injectPropertyFetcher} from "../../injects/injects-fetcher";
import Paths from "../../api/paths";
import IUsers from "../../reducers/users/model";


export default class UsersService implements IUsersService {

    @injectPropertyFetcher
    private fetcher!: IFetcher;

    getUserRecord = async(nickname: string) => {
        return await this.fetcher.get(Paths.Users.GetUserRecord(nickname))
    };

    getLeaderboard = async(limit: number) => {
        return await this.fetcher.get(Paths.Users.GetLeaderboard(), {
            params: {limit}
        })
    };

    saveRecord = async(record: IUsers.ModelAPI) => {
        return await this.fetcher.post(Paths.Users.SaveRecord(), record)
    };
}