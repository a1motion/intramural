export const getColorFromStatus = (build) => {
  if (build === null) {
    return `blue`
  }
  if (build.status === `SUCCESS`) {
    return `green`
  }
  if (build.status === `PENDING`) {
    return `grey`
  }
  return `red`
}
