import {configuration} from "../config";

const base = (rest: string) => `${configuration.remoteApi}/${rest}`;

export default class Paths {

    static Users = class {
        static GetUserRecord = (nickName: string) => base(`users/${nickName}/record`);
        static GetLeaderboard = () => base(`users/leaderboard`);
        static SaveRecord = () => base(`users/record`);
    };
}
