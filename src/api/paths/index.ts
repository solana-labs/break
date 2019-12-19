import {configuration} from "../config";
import IUsers from "../../reducers/users/model";

const base = (rest: string) => `${configuration.remoteApi}/${rest}`;

export default class Paths {

    static Users = class {
        static GetUserRecord = (nickname: string) => base(`users/${nickname}/record`);
        static GetLeaderboard = () => base(`users/leaderboard`);
        static SaveRecord = () => base(`users/record`);
    };
}
