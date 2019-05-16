import React, { useEffect, useState } from "react"
import ky from "ky"
import Container from "../components/container"

export default () => {
  const [repos, setRepos] = useState([])
  useEffect(() => {
    ky(`//localhost:9005/api/repos`, {
      credentials: `include`,
    })
      .json()
      .then((data) => {
        setRepos(data)
      })
  }, [])
  return <Container />
}
