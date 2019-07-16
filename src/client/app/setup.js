import React from "react";
import { Provider } from "react-redux";
import { hot } from "react-hot-loader/root";
import { BrowserRouter as Router } from "react-router-dom";
import configureStore from "./configureStore";
import App from "./";

const store = configureStore();
const Setup = () => (
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
);

export default hot(Setup);
