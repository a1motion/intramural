import { useState, useEffect } from "react"
import ky from "ky"

export function useKy(url, options) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    ky(url, options)
      .json()
      .then((data) => {
        setData(data)
        setLoading(false)
      })
  }, [])
  return [data, loading]
}
