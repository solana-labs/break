import { Action, SET_STATISTICS_GAME } from "../types";
import * as IGame from "../../reducers/game/model";

export const setStatisticsGame = (
  statistics: IGame.ModelStatistics
): Action => {
  return {
    type: SET_STATISTICS_GAME,
    payload: statistics
  };
};
