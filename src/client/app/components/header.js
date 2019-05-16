import React from "react"
import { connect } from "react-redux"
import {} from "semantic-ui-react"
import { USER_PENDING, USER_LOGGED_IN, USER_LOGGED_OUT } from "../actions/user"

function mapStateToProps(state) {
  const { user } = state
  return { user }
}

export const Header = connect(mapStateToProps)(({ user }) => <div />)
