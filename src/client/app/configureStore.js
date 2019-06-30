import { createStore, applyMiddleware } from "redux";
import rootReducer from "./reducers";

export default () => {
  /* eslint-disable no-underscore-dangle */
  const store = createStore(
    rootReducer,
    window.__INITIAL_STATE,
    applyMiddleware(
      ...[
        window.__REDUX_DEVTOOLS_EXTENSION__ &&
          window.__REDUX_DEVTOOLS_EXTENSION__(),
      ].filter((a) => a)
    )
  );
  return store;
};
