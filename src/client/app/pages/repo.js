import React from "react"

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment"
import SegmentGroup from "semantic-ui-react/dist/es/elements/Segment/SegmentGroup"
import Placeholder from "semantic-ui-react/dist/es/elements/Placeholder/Placeholder"
import PlaceholderParagraph from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderParagraph"
import PlaceholderLine from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderLine"
import Header from "semantic-ui-react/dist/es/elements/Header/Header"
import HeaderContent from "semantic-ui-react/dist/es/elements/Header/HeaderContent"
import Icon from "semantic-ui-react/dist/es/elements/Icon/Icon"

import { Redirect, Link } from "react-router-dom"
import Container from "../components/container"
import { useKy } from "../utils/useKy"
import { css } from "linaria"

import "semantic-ui-css/components/segment.min.css"
import "semantic-ui-css/components/placeholder.min.css"
import "semantic-ui-css/components/icon.min.css"
import "semantic-ui-css/components/header.min.css"

const FlexBox = css`
  display: flex;
`
const CenterIcon = css`
  display: flex;
  align-items: center;
`
const Section = css`
  width: 25%;
`
const Item = css`
  margin: 8px 0;
  font-size: 1.15rem;
`
const HeaderIcon = css`
  .${CenterIcon}:hover & {
    opacity: 1 !important;
  }
  opacity: 0 !important;
  margin-left: 0.5em !important;
  transition: opacity 0.2s;
`
function getTimeSince(date) {
  const seconds = Math.floor((Date.now() - date) / 1000)
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  const months = days / 30
  if (months >= 1) {
    return `${Math.round(months)} month${Math.round(months) > 1 ? `s` : ``} ago`
  }
  if (days >= 1) {
    return `${Math.round(days)} day${Math.round(days) > 1 ? `s` : ``} ago`
  }
  if (hours >= 1) {
    return `${Math.round(hours)} day${Math.round(hours) > 1 ? `s` : ``} ago`
  }
  if (minutes >= 1) {
    return `${Math.round(minutes)} day${Math.round(minutes) > 1 ? `s` : ``} ago`
  }
  return ``
}
function getBuildTime(elasped) {
  let seconds = Math.floor(elasped / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  seconds %= 60
  return [
    hours > 0 && `${hours} hour `,
    minutes > 0 && `${minutes} min `,
    `${seconds} sec`,
  ].filter(Boolean)
}
const Builds = ({ loading, builds, owner, repo }) => {
  if (loading) {
    return (
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
    )
  }
  if (builds.error) {
    return <Redirect to={`/`} />
  }
  return (
    <SegmentGroup>
      {builds
        .sort((a, b) => {
          if (b.branch === `master`) {
            return 1
          }
          return Number(b.id) - Number(a.id)
        })
        .map((build) => (
          <Segment
            key={build.id}
            color={
              build.status === `success`
                ? `green`
                : build.status === `pending`
                ? `grey`
                : build.status === null
                ? `blue`
                : `red`
            }>
            <div className={FlexBox}>
              <div className={Section}>
                <div className={Item}>
                  <Link to={`/${owner}/${repo}/builds/${build.num}`}>
                    {build.branch} (#{build.num})
                  </Link>
                </div>
                <div className={Item}>
                  {build.total_builds} build
                  {build.total_builds > 1 ? `s` : ``}
                </div>
              </div>
              <div className={Section}>
                <div className={Item}>
                  <Icon name={`calendar outline`} color={`grey`} />
                  {getTimeSince(build.start_time)}
                </div>
                <div className={Item}>
                  <Icon name={`clock outline`} color={`grey`} />
                  {build.end_time === null
                    ? `?`
                    : getBuildTime(build.end_time - build.start_time)}
                </div>
              </div>
            </div>
          </Segment>
        ))}
    </SegmentGroup>
  )
}

export default ({
  match: {
    params: { owner, repo },
  },
}) => {
  const [builds, loading] = useKy(
    `${
      process.env.NODE_ENV === `development` ? `//localhost:9005` : ``
    }/api/builds/${owner}/${repo}`,
    {
      credentials: `include`,
    }
  )
  return (
    <Container>
      <Header>
        <HeaderContent>
          <span className={CenterIcon}>
            <a href={`https://github.com/${owner}/${repo}`}>
              {owner}/{repo}
            </a>
            <Icon name={`external`} size={`tiny`} className={HeaderIcon} />
          </span>
        </HeaderContent>
      </Header>
      <Builds builds={builds} loading={loading} owner={owner} repo={repo} />
    </Container>
  )
}
