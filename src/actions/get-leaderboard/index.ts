import {GET_LEADERBOARD} from "../types";
import IUsers from "../../reducers/users/model";

export const getLeaderboard = (payload: IUsers.Leaderboard) => {
    return {
        type: GET_LEADERBOARD,
        payload
    }
};
