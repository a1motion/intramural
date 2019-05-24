import React, { useState, useEffect } from "react"

import { Link } from "react-router-dom"
import { css } from "linaria"

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment"
import SegmentGroup from "semantic-ui-react/dist/es/elements/Segment/SegmentGroup"
import Icon from "semantic-ui-react/dist/es/elements/Icon/Icon"
import Breadcrumb from "semantic-ui-react/dist/es/collections/Breadcrumb/Breadcrumb"
import BreadcrumbDivider from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbDivider"
import BreadcrumbSection from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbSection"

import Container from "../components/container"
import LoadingStack from "../components/LoadingStack"

import Query from "../utils/Query"

import "semantic-ui-css/components/segment.min.css"
import "semantic-ui-css/components/icon.min.css"
import "semantic-ui-css/components/breadcrumb.min.css"

import { getColorFromStatus } from "../utils/getColorFromStatus"
import { classnames } from "../utils/classnames"

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

const Job = css`
  cursor: pointer;
  display: block;
  &:hover {
    background-color: #f0f0f0;
  }
`

const FlexBox = css`
  display: flex;
  align-items: center;
`
const FlexShrink = css`
  flex: 0 0 auto;
`
const FlexGrow = css`
  flex: 1 1 auto;
`
const GET_BUILD_QUERY = `query ($buildId: ID!){
  build(id: $buildId) {
    num
    jobs {
      id
      num
      os
      startTime
      endTime
      status
      tag
    }
  }
}`

const RealTime = ({ startTime }) => {
  const [current, setCurrent] = useState(getBuildTime(Date.now() - startTime))
  useEffect(() => {
    const s = setInterval(() => {
      setCurrent(getBuildTime(Date.now() - startTime))
    }, 1000)
    return () => clearInterval(s)
  }, [startTime])
  return current
}

export default ({
  match: {
    params: { build, owner, repo },
  },
}) => {
  const [buildNum, setBuildNum] = useState(null)
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
        {buildNum !== null && (
          <>
            <BreadcrumbDivider icon={`right chevron`} />
            <BreadcrumbSection
              as={Link}
              to={`/${owner}/${repo}/builds/${build}`}>
              #{buildNum}
            </BreadcrumbSection>
          </>
        )}
      </Breadcrumb>
      <SegmentGroup>
        <Query query={GET_BUILD_QUERY} variables={{ buildId: build }}>
          {({ loading, data, error }) => {
            if (loading) {
              return <LoadingStack />
            }
            const { build } = data
            setBuildNum(build.num)
            return build.jobs.map((job) => (
              <Segment
                as={Link}
                to={`/${owner}/${repo}/jobs/${job.id}`}
                key={job.num}
                color={getColorFromStatus(job)}
                className={classnames(FlexBox, Job)}>
                <span className={FlexGrow}>
                  #{build.num}.{job.num}
                </span>
                <span className={FlexGrow}>{job.tag}</span>
                <span className={FlexShrink}>
                  <Icon name={`clock outline`} color={`grey`} />
                  {job.startTime === null ? (
                    `Waiting`
                  ) : job.endTime === null ? (
                    <RealTime startTime={job.startTime} />
                  ) : (
                    getBuildTime(job.endTime - job.startTime)
                  )}
                </span>
              </Segment>
            ))
          }}
        </Query>
      </SegmentGroup>
    </Container>
  )
}
