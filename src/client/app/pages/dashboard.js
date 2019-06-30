import React from "react";
import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import SegmentGroup from "semantic-ui-react/dist/es/elements/Segment/SegmentGroup";
import Placeholder from "semantic-ui-react/dist/es/elements/Placeholder/Placeholder";
import PlaceholderParagraph from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderParagraph";
import PlaceholderLine from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderLine";
import { Link } from "react-router-dom";
import Container from "../components/container";
import { css } from "linaria";
import "semantic-ui-css/components/segment.min.css";
import "semantic-ui-css/components/placeholder.min.css";
import Query from "../utils/Query";
import { getColorFromStatus } from "../utils/getColorFromStatus";

const Repo = css`
  cursor: pointer;
  display: block;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const GET_REPOS = `{
  repositories {
    id
    fullName
    lastBuild {
      status
    }
  }
}
`;

const Dashboard = () => {
  return (
    <Container>
      <SegmentGroup stacked>
        <Query query={GET_REPOS}>
          {({ loading, error, data }) => {
            if (error) {
              return <div />;
            }

            if (loading || !data) {
              return new Array(8).fill(0).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Segment key={i}>
                  <Placeholder>
                    <PlaceholderParagraph>
                      <PlaceholderLine />
                    </PlaceholderParagraph>
                  </Placeholder>
                </Segment>
              ));
            }

            return data.repositories.map((repo) => (
              <Segment
                padded
                className={Repo}
                key={repo.id}
                as={Link}
                to={`/${repo.fullName}`}
                color={getColorFromStatus(repo.lastBuild)}>
                <span>{repo.fullName}</span>
              </Segment>
            ));
          }}
        </Query>
      </SegmentGroup>
    </Container>
  );
};

export default Dashboard;
