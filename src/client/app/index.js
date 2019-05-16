import React, { useEffect, Suspense, lazy } from "react"
import { Switch, Route } from "react-router-dom"
import ky from "ky"
import { connect } from "react-redux"
import { Header } from "./components/header"
import { USER_PENDING, USER_LOGGED_IN, checkLogin } from "./actions/user"
import "./index.css"

const Dashboard = lazy(() => import(`./pages/dashboard`))

function mapStateToProps(state) {
  const { user } = state
  return { user }
}

export default connect(mapStateToProps)(({ dispatch, user }) => {
  useEffect(() => {
    ky(`//localhost:9005/api/me`, {
      credentials: `include`,
    })
      .json()
      .then((data) => {
        dispatch(checkLogin(data))
      })
  }, [])
  return (
    <div>
      <Header />
      <Suspense fallback={<div />}>
        {user.status === USER_LOGGED_IN && (
          <Switch>
            <Route path={`/`} component={Dashboard} />
          </Switch>
        )}
        {user.status === USER_PENDING && <div />}
      </Suspense>
    </div>
  )
})
