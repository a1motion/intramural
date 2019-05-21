import React from "react"
import { css } from "linaria"
import { classnames } from "../utils/classnames"

const container = css`
  margin: 3em auto;
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
  <div {...props} className={classnames(container, props.className)} />
)
