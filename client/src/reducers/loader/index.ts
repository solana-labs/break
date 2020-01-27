import { SET_STATUS_LOADER } from "../../actions/types";
import * as ILoader from "./model";

const initState: ILoader.Model = {
  isActive: false
};

const loaderReducer = (state = initState, action: any): ILoader.Model => {
  switch (action.type) {
    case SET_STATUS_LOADER: {
      return {
        ...state,
        isActive: action.payload
      };
    }
    default:
      return state;
  }
};

export default loaderReducer;
