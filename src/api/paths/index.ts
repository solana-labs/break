import { configuration } from "../config";

const base = (rest: string): string => `${configuration.remoteApi}/${rest}`;

export default class Paths {
  static Game = class {
    static SaveGame = (): string => base(`games`);
    static GetDailyGameCounts = (): string => base(`games/daily`);
    static GetDailyTransactionCounts = (): string =>
      base(`games/daily/transactions`);
    static GetGameTransactionCounts = (): string =>
      base(`games/latest/transactions`);
  };

  static Users = class {
    static GetLeaderboard = (): string => base(`users/leaderboard`);
  };
}
