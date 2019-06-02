import React, { useState, useEffect } from "react"

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment"
import Input from "semantic-ui-react/dist/es/elements/Input/Input"
import Breadcrumb from "semantic-ui-react/dist/es/collections/Breadcrumb/Breadcrumb"
import BreadcrumbDivider from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbDivider"
import BreadcrumbSection from "semantic-ui-react/dist/es/collections/Breadcrumb/BreadcrumbSection"

import { Link } from "react-router-dom"
import { css } from "linaria"

import Container from "../components/container"
import LoadingStack from "../components/LoadingStack"

import Query from "../utils/Query"

import "semantic-ui-css/components/segment.min.css"
import "semantic-ui-css/components/breadcrumb.min.css"
import "semantic-ui-css/components/input.min.css"

const PADDED = css`
  padding: 20px 0;
`

const GET_ENV_VARIABLES = `query($fullName: String!) {
  repository(fullName: $fullName) {
    id
  }
}`
export default ({
  match: {
    params: { owner, repo },
  },
}) => {
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
      </Breadcrumb>
      <Query
        query={GET_ENV_VARIABLES}
        variables={{ fullName: `${owner}/${repo}` }}>
        {({ loading, data, error }) => {
          if (error) {
            return <div />
          }
          if (loading) {
            return <LoadingStack />
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
                <Segment padded={`very`} attached />
              </div>
            </div>
          )
        }}
      </Query>
    </Container>
  )
}
