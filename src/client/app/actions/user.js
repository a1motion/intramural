export const USER_PENDING = Symbol(`USER_PENDING`);

export const USER_LOGGED_IN = Symbol(`USER_LOGGED_IN`);

export const USER_LOGGED_OUT = Symbol(`USER_LOGGED_OUT`);

export function checkLogin(data) {
  if (data === null) {
    return {
      type: USER_LOGGED_OUT,
    };
  }

  return {
    type: USER_LOGGED_IN,
    payload: data,
  };
}
