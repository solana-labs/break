import {configuration} from "../config";

const base = (rest: string) => `${configuration.remoteApi}/${rest}`;

export default class Paths {

    static Users = class {
        static GetLeaderboard = () => base(`users/leaderboard`);
    };
}
