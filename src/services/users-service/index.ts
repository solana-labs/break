import {IUsersService} from "./model";
import {IFetcher} from "../../api/fetcher/model";
import {injectPropertyFetcher} from "../../injects/injects-fetcher";
import Paths from "../../api/paths";


export default class UsersService implements IUsersService {

    @injectPropertyFetcher
    private fetcher!: IFetcher;

    getUserRecord = async(nickName: string) => {
        return await this.fetcher.get(Paths.Users.GetUserRecord(nickName))
    };

    getLeaderboard = async(limit: number) => {
        return await this.fetcher.get(Paths.Users.GetLeaderboard(), {
            params: {limit}
        })
    };

    saveRecord = async() => {
        return await this.fetcher.post(Paths.Users.SaveRecord())
    };
}