import React, { useState } from "react";
import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import Message from "semantic-ui-react/dist/es/collections/Message/Message";
import Form from "semantic-ui-react/dist/es/collections/Form/Form";
import Button from "semantic-ui-react/dist/es/elements/Button/Button";
import ButtonContent from "semantic-ui-react/dist/es/elements/Button/ButtonContent";
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
import ky from "ky";

const PADDED = css`
  padding: 20px 0;
`;
const SAVE_BUTTON_CONTAINER = css`
  display: flex;
  padding: 12px 0px;
  justify-content: flex-end;
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
    environmentVariables
  }
}`;
const EnvironmentVariables = ({ current, owner, repo }) => {
  const [env, setEnv] = useState(current);
  const [loading, setLoading] = useState(false);
  const saveEnvironmentVariables = async (env) => {
    setLoading(true);
    await ky.post(
      `${
        process.env.NODE_ENV === `development` ? `//localhost:9005` : ``
      }/api/${owner}/${repo}/env`,
      {
        credentials: `include`,
        json: { env },
      }
    );
    setLoading(false);
  };

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
        <div className={SAVE_BUTTON_CONTAINER}>
          <Button
            onClick={() => saveEnvironmentVariables(env)}
            loading={loading}>
            <ButtonContent>Save</ButtonContent>
          </Button>
        </div>
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
                <EnvironmentVariables
                  current={data.repository.environmentVariables}
                  owner={owner}
                  repo={repo}
                />
              </div>
            </div>
          );
        }}
      </Query>
    </Container>
  );
};
