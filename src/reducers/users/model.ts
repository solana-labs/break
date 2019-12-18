import {Maybe} from "../../toolbox/custom-types";

namespace IUsers {

    export interface ModelAPI {
        nickname: string
        record: number
    }

    export interface Model extends ModelAPI {

    }

    export interface Leaderboard {
        list: Maybe<Model[]>,
        totalCount: Maybe<number>
    }

    export interface ModelState {
        leaderboard: Maybe<Leaderboard>
    }
}

export default IUsers;
