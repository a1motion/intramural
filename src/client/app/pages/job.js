import React, { useState, useEffect } from "react";
import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import Breadcrumb from "semantic-ui-react/dist/es/collections/Breadcrumb/Breadcrumb";
import BreadcrumbDivider from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbDivider";
import BreadcrumbSection from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbSection";
import { Link } from "react-router-dom";
import { css } from "linaria";
import { Helmet } from "react-helmet";
import Container from "../components/container";
import LoadingStack from "../components/LoadingStack";
import Query from "../utils/Query";
import ws from "../utils/ws";
import "semantic-ui-css/components/segment.min.css";
import "semantic-ui-css/components/breadcrumb.min.css";
import "semantic-ui-css/components/icon.min.css";
import colorCode from "@a1motion/color-code";
import { getColorFromStatus } from "../utils/getColorFromStatus";

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

const GET_JOB_QUERY = `query ($jobId: ID!){
  job(id: $jobId) {
    id
    num
    log
    status
    startTime
    endTime
    build {
      id
      num
      branch
      pr
    }
  }
}`;

const PendingLogs = css`
  min-height: 400px;
`;

const Black = css`
  background-color: #000 !important;
  padding: 0 3em !important;
`;

const LogsWrapper = css`
  counter-reset: line;
  background-color: #000;
  color: #fff;
  margin: 0;
  padding: 1em 0;
`;
const LogsLine = css`
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
  &:before {
    counter-increment: line;
    text-align: right;
    content: counter(line);
    display: inline-block;
    padding: 0 0.5em;
    color: #ddd;
    background-color: #333;
    min-width: 40px;
    margin-left: -40px;
    margin-right: 1em;
  }
`;
const FlexBox = css`
  display: flex;
  align-items: center;
`;
const Item = css`
  margin: 8px 0;
  font-size: 1.15rem;
`;
const FlexGrow = css`
  flex: 1 1 auto;
`;
const RealTimeLogs = ({ initial, job }) => {
  const [logs, setLogs] = useState(initial);
  useEffect(() => {
    let current = initial;
    ws.send(JSON.stringify({ subscribe: `logs:${job}` }));
    ws.onmessage = (msg) => {
      const { data } = msg;
      const parsed = JSON.parse(data);
      if (parsed.event && parsed.event === `logs:${job}`) {
        current += parsed.payload;
        setLogs(current);
      }
    };

    return () => {
      ws.send(JSON.stringify({ unsubscribe: `logs:${job}` }));
    };
  }, []);
  return (
    <Segment padded={`very`} className={Black}>
      <pre className={LogsWrapper}>
        {(logs || ``).split(`\n`).map((line, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={LogsLine}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: colorCode(line) }}
          />
        ))}
      </pre>
    </Segment>
  );
};

const Logs = ({ job }) => {
  if (job.status === `WAITING`) {
    return (
      <Segment
        padded={`very`}
        loading
        className={PendingLogs}
        piled
        color={`grey`}
      />
    );
  }

  if (job.status === `PENDING`) {
    return <RealTimeLogs initial={job.log} job={job.id} color={`yellow`} />;
  }

  return (
    <Segment className={Black}>
      <pre className={LogsWrapper}>
        {(job.log || ``).split(`\n`).map((line, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={LogsLine}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: colorCode(line) }}
          />
        ))}
      </pre>
    </Segment>
  );
};

const COLORS = {
  green: `#21ba45`,
  red: `#db2828`,
};

const Job = ({
  match: {
    params: { owner, repo, job },
  },
}) => {
  const [buildId, setBuild] = useState(null);
  const [jobId, setJob] = useState(null);
  return (
    <Container>
      <Breadcrumb>
        <BreadcrumbSection as={Link} to={`/${owner}`}>
          {owner}
        </BreadcrumbSection>
        <BreadcrumbDivider icon={`right chevron`} />
        <BreadcrumbSection as={Link} to={`/${owner}/${repo}`}>
          {repo}
        </BreadcrumbSection>
        {buildId && jobId && (
          <>
            <BreadcrumbDivider icon={`right chevron`} />
            <BreadcrumbSection
              as={Link}
              to={`/${owner}/${repo}/builds/${buildId.id}`}>
              #{buildId.num}
            </BreadcrumbSection>
            <BreadcrumbDivider icon={`right chevron`} />
            <BreadcrumbSection
              as={Link}
              to={`/${owner}/${repo}/jobs/${jobId.id}`}>
              {jobId.num}
            </BreadcrumbSection>
          </>
        )}
      </Breadcrumb>
      <Helmet>
        <title>
          {`${
            buildId && jobId ? `#${buildId.num}.${jobId.num} ` : ``
          }${owner}/${repo}`}
        </title>
      </Helmet>
      <Query query={GET_JOB_QUERY} variables={{ jobId: job }}>
        {({ loading, data, error }) => {
          if (error) {
            return <div />;
          }

          if (loading) {
            return <LoadingStack />;
          }

          const { job } = data;
          setJob(job);
          setBuild(job.build);
          return (
            <>
              <Segment color={getColorFromStatus(job)} className={FlexBox}>
                <div className={FlexGrow}>
                  <div
                    className={Item}
                    style={{ color: COLORS[getColorFromStatus(job)] }}>
                    {job.build.branch}
                  </div>
                </div>
                <div className={FlexGrow}>
                  <div className={Item}>
                    Ran for {getBuildTime(job.endTime - job.startTime)}
                  </div>
                  <div className={Item}>
                    Started {getTimeSince(job.startTime)}
                  </div>
                </div>
              </Segment>
              <Logs job={job} />;
            </>
          );
        }}
      </Query>
    </Container>
  );
};

export default Job;
