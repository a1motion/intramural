import React, { useState } from "react"

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment"
import Loader from "semantic-ui-react/dist/es/elements/Loader/Loader"
import Breadcrumb from "semantic-ui-react/dist/es/collections/Breadcrumb/Breadcrumb"
import BreadcrumbDivider from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbDivider"
import BreadcrumbSection from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbSection"

import { Link } from "react-router-dom"

import Container from "../components/container"
import LoadingStack from "../components/LoadingStack"

import Query from "../utils/Query"

import "semantic-ui-css/components/segment.min.css"
import "semantic-ui-css/components/breadcrumb.min.css"
import "semantic-ui-css/components/icon.min.css"
import "semantic-ui-css/components/loader.min.css"

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
}`

export default ({
  match: {
    params: { owner, repo, job },
  },
}) => {
  const [buildId, setBuild] = useState(null)
  const [jobId, setJob] = useState(null)
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
          if (loading) {
            return <LoadingStack />
          }
          const { job } = data
          setJob(job)
          setBuild(job.build)
          if ([`WAITING`, `PENDING`].includes(job.status)) {
            return (
              <Segment padded={`very`}>
                <Loader>Job is in progress.</Loader>
              </Segment>
            )
          }
          return (
            <Segment padded={`very`} piled>
              <pre>
                <code>{job.log}</code>
              </pre>
            </Segment>
          )
        }}
      </Query>
    </Container>
  )
}
