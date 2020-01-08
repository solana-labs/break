import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import rootAppReducer from "../reducer";

const appStore = createStore(rootAppReducer, applyMiddleware(thunk));

export default appStore;