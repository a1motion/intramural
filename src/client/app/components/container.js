import React from "react"
import { css } from "linaria"

const container = css`
  margin: 0 auto;
  max-width: 1280px;
  width: 90%;
  @media only screen and (min-width: 601px) {
    width: 85%;
  }
  @media only screen and (min-width: 993px) {
    width: 80%;
  }
  @media only screen and (min-width: 1200px) {
    width: 70%;
  }
`

export default (props) => (
  <div {...props} className={[container, props.className]} />
)
