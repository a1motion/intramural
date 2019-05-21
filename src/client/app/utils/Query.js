import { useKy } from "./useKy"

export default ({ children, query, variables }) => {
  const [data, loading] = useKy(
    `${
      process.env.NODE_ENV === `development` ? `//localhost:9005` : ``
    }/graphql`,
    {
      method: `post`,
      json: { query, variables },
      credentials: `include`,
    }
  )
  return children({ loading, ...data })
}
