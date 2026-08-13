import { useEffect, useState } from "react"

// Minimal async-data hook: runs `fn` when `deps` change, tracks
// loading/error/data, and ignores stale responses. Avoids pulling in a
// data-fetching library to keep the dependency footprint small.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  useEffect(() => {
    let alive = true
    setState({ loading: true, error: null, data: null })
    Promise.resolve()
      .then(fn)
      .then((data) => {
        if (alive) setState({ loading: false, error: null, data })
      })
      .catch((error) => {
        if (alive) setState({ loading: false, error, data: null })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
