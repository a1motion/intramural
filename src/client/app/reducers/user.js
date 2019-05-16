import { USER_LOGGED_IN, USER_LOGGED_OUT, USER_PENDING } from "../actions/user"

export default function user(
  state = {
    status: USER_PENDING,
    payload: null,
  },
  action
) {
  switch (action.type) {
    case USER_LOGGED_IN:
      return {
        status: USER_LOGGED_IN,
        payload: action.payload,
      }
    case USER_LOGGED_OUT:
      return {
        status: USER_LOGGED_OUT,
        payload: action.payload,
      }
    default:
      return state
  }
}
