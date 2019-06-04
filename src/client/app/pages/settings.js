import React, { useState } from "react";

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import Message from "semantic-ui-react/dist/es/collections/Message/Message";
import Form from "semantic-ui-react/dist/es/collections/form/form";
import Breadcrumb from "semantic-ui-react/dist/es/collections/Breadcrumb/Breadcrumb";
import BreadcrumbDivider from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbDivider";
import BreadcrumbSection from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbSection";

import TextareaAutosize from "react-textarea-autosize";
import { Link, Redirect } from "react-router-dom";
import { css } from "linaria";
import { Helmet } from "react-helmet";

import Container from "../components/container";
import LoadingStack from "../components/LoadingStack";

import Query from "../utils/Query";

import "semantic-ui-css/components/segment.min.css";
import "semantic-ui-css/components/breadcrumb.min.css";
import "semantic-ui-css/components/form.min.css";
import "semantic-ui-css/components/message.min.css";

const PADDED = css`
  padding: 20px 0;
`;
const REMOVE_WORD_WRAP = css`
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
`;
const GET_ENV_VARIABLES = `query($fullName: String!) {
  repository(fullName: $fullName) {
    id
    hasWriteAccess
  }
}`;

const EnvironmentVariables = ({ current }) => {
  const [env, setEnv] = useState(current);
  return (
    <Segment attached>
      <Message>
        Environment Variables should be posted in a dot file format.
      </Message>
      <Form>
        <TextareaAutosize
          wrap={`soft`}
          className={REMOVE_WORD_WRAP}
          value={env}
          onChange={(e) => setEnv(e.target.value)}
        />
      </Form>
    </Segment>
  );
};
export default ({
  match: {
    params: { owner, repo },
  },
}) => {
  return (
    <Container>
      <Helmet>
        <title>{`Settings ${owner}/${repo}`}</title>
      </Helmet>
      <Breadcrumb>
        <BreadcrumbSection as={Link} to={`/${owner}`}>
          {owner}
        </BreadcrumbSection>
        <BreadcrumbDivider icon={`right chevron`} />
        <BreadcrumbSection as={Link} to={`/${owner}/${repo}`}>
          {repo}
        </BreadcrumbSection>
      </Breadcrumb>
      <Query
        query={GET_ENV_VARIABLES}
        variables={{ fullName: `${owner}/${repo}` }}>
        {({ loading, data, error }) => {
          if (error) {
            return <div />;
          }
          if (loading) {
            return <LoadingStack />;
          }
          if (!data.repository.hasWriteAccess) {
            return <Redirect to={`/${owner}/${repo}`} />;
          }
          return (
            <div className={PADDED}>
              <div>
                <Segment
                  attached={`top`}
                  size={`tiny`}
                  inverted
                  color={`grey`}
                  content={`Environment Variables`}
                />
                <EnvironmentVariables current={``} />
              </div>
            </div>
          );
        }}
      </Query>
    </Container>
  );
};
