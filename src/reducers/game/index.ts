import {RESET_STATISTICS_GAME, SET_STATISTICS_GAME, SET_STATUS_GAME} from "../../actions/types";
import IGame from "./model";

const initState: IGame.ModelState = {
    status: 'unstarted',
    statistics: {
        totalCount: 0,
        completedCount: 0,
        percentCapacity: 0
    }
};

const gameReducer = (state = initState, action: any) => {

    switch (action.type) {
        case SET_STATUS_GAME: {
            return {
                ...state,
                status: action.payload
            }
        }
        case SET_STATISTICS_GAME: {
            return {
                ...state,
                statistics: action.payload
            }
        }
        case RESET_STATISTICS_GAME: {
            return {
                status: 'unstarted',
                statistics: {
                    totalCount: 0,
                    completedCount: 0,
                    percentCapacity: 0
                }
            }
        }
        default:
            return state;
    }
};

export default gameReducer;