import { ReconnectingWebSocket } from "./ReconnectingWebsocket";

export default new ReconnectingWebSocket(
  `ws${process.env.NODE_ENV === `production` ? `s` : ``}://${
    process.env.NODE_ENV === `production` ? location.hostname : `localhost:9005`
  }/ws`
);
