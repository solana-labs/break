import {configuration} from "../config";

const base = (rest: string) => `${configuration.remoteApi}/${rest}`;

export default class Paths {

    static Game = class {
        static SaveGame = () => base(`games`);
        static GetDailyGameCounts = () => base(`games/daily`);
        static GetDailyTransactionCounts = () => base(`games/daily/transactions`);
        static GetGameTransactionCounts = () => base(`games/latest/transactions`);
    };

    static Users = class {
        static GetLeaderboard = () => base(`users/leaderboard`);
    };
}
