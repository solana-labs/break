import {
  RESET_STATISTICS_GAME,
  SET_STATISTICS_GAME
} from "../../actions/types";
import * as IGame from "./model";

const initState: IGame.ModelState = {
  statistics: {
    totalCount: 0,
    completedCount: 0,
    percentCapacity: 0
  }
};

const gameReducer = (state = initState, action: any): IGame.ModelState => {
  switch (action.type) {
    case SET_STATISTICS_GAME: {
      return {
        ...state,
        statistics: action.payload
      };
    }
    case RESET_STATISTICS_GAME: {
      return {
        ...state,
        statistics: {
          totalCount: 0,
          completedCount: 0,
          percentCapacity: 0
        }
      };
    }
    default:
      return state;
  }
};

export default gameReducer;
