import {GET_PEOPLE} from "../types";
import IPeople from "../../reducers/people/model";

export const getPeople = (payload: IPeople.GetPeopleAPI) => {
    return {
        type: GET_PEOPLE,
        payload
    }
};
