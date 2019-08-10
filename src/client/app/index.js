import React, { useEffect, Suspense, lazy } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import ky from "ky";
import { connect } from "react-redux";
import { Header } from "./components/header";
import { USER_PENDING, checkLogin } from "./actions/user";
import "./index.css";
import "semantic-ui-css/components/reset.min.css";
import "semantic-ui-css/components/site.min.css";

const Dashboard = lazy(() =>
  import(/* webpackChunkName: "dashboard" */ `./pages/dashboard`)
);
const Repo = lazy(() => import(/* webpackChunkName: "repo" */ `./pages/repo`));
const Build = lazy(() =>
  import(/* webpackChunkName: "build" */ `./pages/build`)
);
const Job = lazy(() => import(/* webpackChunkName: "job" */ `./pages/job`));
const Settings = lazy(() =>
  import(/* webpackChunkName: "settings" */ `./pages/settings`)
);

function mapStateToProps(state) {
  const { user } = state;
  return { user };
}

export default connect(mapStateToProps)(({ dispatch, user }) => {
  useEffect(() => {
    ky(
      `${
        process.env.NODE_ENV === `development` ? `//localhost:9005` : ``
      }/api/me`,
      {
        credentials: `include`,
      }
    )
      .json()
      .then((data) => {
        dispatch(checkLogin(data));
      });
  }, []);
  return (
    <div>
      <Header />
      <Suspense fallback={<div />}>
        {user.status !== USER_PENDING && (
          <Switch>
            <Route
              path={`/:owner/:repo/builds/:build`}
              exact
              component={Build}
            />
            <Route path={`/:owner/:repo/jobs/:job`} exact component={Job} />
            <Route path={`/:owner/:repo/settings`} exact component={Settings} />
            <Route path={`/:owner/:repo`} exact component={Repo} />
            <Route path={`/`} exact component={Dashboard} />
            <Route render={() => <Redirect to={`/`} />} />
          </Switch>
        )}
        {user.status === USER_PENDING && <div />}
      </Suspense>
    </div>
  );
});
