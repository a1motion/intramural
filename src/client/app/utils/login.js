export default () => {
  location.href = `${
    process.env.NODE_ENV === `development` ? `http://localhost` : ``
  }/g`;
};
