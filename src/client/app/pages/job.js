import React, { useState, useEffect } from "react";

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import Breadcrumb from "semantic-ui-react/dist/es/collections/Breadcrumb/Breadcrumb";
import BreadcrumbDivider from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbDivider";
import BreadcrumbSection from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbSection";

import { Link } from "react-router-dom";
import { css } from "linaria";

import Container from "../components/container";
import LoadingStack from "../components/LoadingStack";

import Query from "../utils/Query";
import ws from "../utils/ws";

import "semantic-ui-css/components/segment.min.css";
import "semantic-ui-css/components/breadcrumb.min.css";
import "semantic-ui-css/components/icon.min.css";
import { getColorFromStatus } from "../utils/getColorFromStatus";

const GET_JOB_QUERY = `query ($jobId: ID!){
  job(id: $jobId) {
    id
    num
    log
    status
    build {
      id
      num
    }
  }
}`;

const PendingLogs = css`
  min-height: 400px;
`;

const LogsWrapper = css`
  counter-reset: line;
`;
const LogsLine = css`
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
  border-left: 1px solid #ddd;
  border-top: 1px solid #eeeeeeee;
  border-right: 1px solid #eeeeeeee;
  &:last-of-type {
    border-bottom: 1px solid #eeeeeeee;
  }
  &:before {
    counter-increment: line;
    text-align: right;
    content: counter(line);
    display: inline-block;
    padding: 0 0.5em;
    color: #888;
    min-width: 40px;
    margin-left: -40px;
    margin-right: 1em;
  }
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
    <Segment padded={`very`} piled color={`yellow`}>
      <pre className={LogsWrapper}>
        {(logs || ``).split(`\n`).map((line, i) => (
          <span key={i} className={LogsLine}>
            {line}
          </span>
        ))}
      </pre>
    </Segment>
  );
};

export default ({
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
          if (job.status === `WAITING`) {
            return (
              <Segment padded={`very`} loading className={PendingLogs} piled />
            );
          }
          if (job.status === `PENDING`) {
            return <RealTimeLogs initial={job.log} job={job.id} />;
          }
          return (
            <Segment
              padded={`very`}
              piled
              color={getColorFromStatus(job.status)}>
              <pre className={LogsWrapper}>
                {(job.log || ``).split(`\n`).map((line, i) => (
                  <span key={i} className={LogsLine}>
                    {line}
                  </span>
                ))}
              </pre>
            </Segment>
          );
        }}
      </Query>
    </Container>
  );
};
