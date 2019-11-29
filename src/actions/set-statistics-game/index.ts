import {SET_STATISTICS_GAME} from "../types";
import IGame from "../../reducers/game/model";

export const setStatisticsGame = (statistics: IGame.ModelStatistics) => {
    return {
        type: SET_STATISTICS_GAME,
        payload: statistics
    }
};