import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { Setup } from "./app/setup";
ReactDOM.render(<Setup />, document.getElementById(`root`));

if (module && module.hot && module.hot.accept) {
  module.hot.accept(() => {
    ReactDOM.render(<Setup />, document.getElementById(`root`));
  });
}
