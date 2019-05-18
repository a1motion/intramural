import React from "react"

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment"
import SegmentGroup from "semantic-ui-react/dist/es/elements/Segment/SegmentGroup"
import Placeholder from "semantic-ui-react/dist/es/elements/Placeholder/Placeholder"
import PlaceholderParagraph from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderParagraph"
import PlaceholderLine from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderLine"

import { Link } from "react-router-dom"
import Container from "../components/container"
import { useKy } from "../utils/useKy"
import { css } from "linaria"

import "semantic-ui-css/components/segment.min.css"
import "semantic-ui-css/components/placeholder.min.css"

const BuildInfo = ({ repo }) => <div />

const Repo = css`
  cursor: pointer;
  display: block;
  &:hover {
    background-color: #f0f0f0;
  }
`
export default () => {
  const [repos, loading] = useKy(
    `${
      process.env.NODE_ENV === `development` ? `//localhost:9005` : ``
    }/api/repos`,
    {
      credentials: `include`,
    }
  )
  if (loading) {
    return (
      <Container>
        <SegmentGroup>
          {new Array(8).fill(0).map((_, i) => (
            <Segment key={i}>
              <Placeholder>
                <PlaceholderParagraph>
                  <PlaceholderLine />
                </PlaceholderParagraph>
              </Placeholder>
            </Segment>
          ))}
        </SegmentGroup>
      </Container>
    )
  }
  return (
    <Container>
      <SegmentGroup stacked>
        {repos.map((repo) => (
          <Segment
            padded
            className={Repo}
            key={repo.id}
            as={Link}
            to={`/${repo.full_name}`}
            color={
              repo.status === `success`
                ? `green`
                : repo.status === `pending`
                ? `grey`
                : repo.status === null
                ? `blue`
                : `red`
            }>
            <span>{repo.full_name}</span>
          </Segment>
        ))}
      </SegmentGroup>
    </Container>
  )
}
