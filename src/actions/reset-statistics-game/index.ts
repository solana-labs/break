import {Action, RESET_STATISTICS_GAME} from "../types";

export const resetStatisticsGame = (): Action => {
    return {
        type: RESET_STATISTICS_GAME,
    }
};