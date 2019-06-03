import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import configureStore from "./configureStore";
import App from "./";

const store = configureStore();

export const Setup = () => (
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
);
