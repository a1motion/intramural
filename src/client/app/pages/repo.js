import React, { useState, useEffect } from "react";
import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import SegmentGroup from "semantic-ui-react/dist/es/elements/Segment/SegmentGroup";
import Icon from "semantic-ui-react/dist/es/elements/Icon/Icon";
import Breadcrumb from "semantic-ui-react/dist/es/collections/Breadcrumb/Breadcrumb";
import BreadcrumbDivider from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbDivider";
import BreadcrumbSection from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbSection";
import Button from "semantic-ui-react/dist/es/elements/Button/Button";
import ButtonContent from "semantic-ui-react/dist/es/elements/Button/ButtonContent";
import { Helmet } from "react-helmet";
import { Redirect, Link } from "react-router-dom";
import Container from "../components/container";
import { css } from "linaria";
import "semantic-ui-css/components/segment.min.css";
import "semantic-ui-css/components/icon.min.css";
import "semantic-ui-css/components/breadcrumb.min.css";
import "semantic-ui-css/components/button.min.css";
import Query from "../utils/Query";
import { getColorFromStatus } from "../utils/getColorFromStatus";
import LoadingStack from "../components/LoadingStack";

const FlexBox = css`
  display: flex;
  align-items: center;
`;
const FlexGrow = css`
  flex: 1 0 auto;
`;
const FlexShrink = css`
  flex: 0 0 auto;
`;
const Section = css`
  width: 33%;
`;
const Item = css`
  margin: 8px 0;
  font-size: 1.15rem;
`;

function getTimeSince(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;
  if (months >= 1) {
    return `${Math.round(months)} month${
      Math.round(months) > 1 ? `s` : ``
    } ago`;
  }

  if (days >= 1) {
    return `${Math.round(days)} day${Math.round(days) > 1 ? `s` : ``} ago`;
  }

  if (hours >= 1) {
    return `${Math.round(hours)} hour${Math.round(hours) > 1 ? `s` : ``} ago`;
  }

  if (minutes >= 1) {
    return `${Math.round(minutes)} min${
      Math.round(minutes) > 1 ? `s` : ``
    } ago`;
  }

  return ``;
}

function getBuildTime(elasped) {
  let seconds = Math.floor(elasped / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  seconds %= 60;
  return [
    hours > 0 && `${hours} hour `,
    minutes > 0 && `${minutes} min `,
    `${seconds} sec`,
  ].filter(Boolean);
}

const RealTime = ({ startTime }) => {
  const [current, setCurrent] = useState(getBuildTime(Date.now() - startTime));
  useEffect(() => {
    const s = setInterval(() => {
      setCurrent(getBuildTime(Date.now() - startTime));
    }, 1000);
    return () => clearInterval(s);
  }, [startTime]);
  return current;
};

const Builds = ({ loading, builds, owner, repo }) => {
  if (loading) {
    return (
      <SegmentGroup>
        <LoadingStack />
      </SegmentGroup>
    );
  }

  if (builds.error) {
    return <Redirect to={`/`} />;
  }

  return (
    <SegmentGroup>
      {builds
        .sort((a, b) => {
          if (b.branch === `master`) {
            return 1000;
          }

          return -1;
        })
        .map((build) => (
          <Segment key={build.id} color={getColorFromStatus(build)}>
            <div className={FlexBox}>
              <div className={Section}>
                <div className={Item}>
                  <Link to={`/${owner}/${repo}/builds/${build.id}`}>
                    {build.branch} (#{build.num})
                  </Link>
                </div>
                <div className={Item}>
                  {build.totalBuilds} build
                  {build.totalBuilds > 1 ? `s` : ``}
                </div>
              </div>
              <div className={Section}>
                <div className={Item}>
                  <Icon name={`calendar outline`} color={`grey`} />
                  {build.endTime === null
                    ? `Running`
                    : getTimeSince(build.startTime)}
                </div>
                <div className={Item}>
                  <Icon name={`clock outline`} color={`grey`} />
                  {build.endTime === null ? (
                    <RealTime startTime={build.startTime} />
                  ) : (
                    getBuildTime(build.endTime - build.startTime)
                  )}
                </div>
              </div>
            </div>
          </Segment>
        ))}
    </SegmentGroup>
  );
};

const GET_BUILDS = `query($fullName: String!) {
  repository(fullName: $fullName) {
    hasWriteAccess
    builds {
      id
      num
      branch
      totalBuilds
      endTime
      startTime
      status
      branch
    }
  }
}`;

const Repo = ({
  match: {
    params: { owner, repo },
  },
}) => {
  return (
    <Container>
      <Query query={GET_BUILDS} variables={{ fullName: `${owner}/${repo}` }}>
        {({ loading, error, data }) => {
          if (error) {
            return <div />;
          }

          return (
            <>
              <Helmet>
                <title>
                  {owner}/{repo}
                </title>
              </Helmet>
              <div className={FlexBox}>
                <Breadcrumb className={FlexGrow}>
                  <BreadcrumbSection as={Link} to={`/${owner}`}>
                    {owner}
                  </BreadcrumbSection>
                  <BreadcrumbDivider icon={`right chevron`} />
                  <BreadcrumbSection as={Link} to={`/${owner}/${repo}`}>
                    {repo}
                  </BreadcrumbSection>
                </Breadcrumb>
                {!loading && data.repository.hasWriteAccess && (
                  <div className={FlexShrink}>
                    <Button
                      size={`tiny`}
                      compact
                      basic
                      animated
                      as={Link}
                      to={`/${owner}/${repo}/settings`}>
                      <ButtonContent visible>Settings</ButtonContent>
                      <ButtonContent hidden>
                        <Icon name={`settings`} />
                      </ButtonContent>
                    </Button>
                  </div>
                )}
              </div>
              <Builds
                builds={loading ? [] : data.repository.builds}
                loading={loading}
                owner={owner}
                repo={repo}
              />
            </>
          );
        }}
      </Query>
    </Container>
  );
};

export default Repo;
