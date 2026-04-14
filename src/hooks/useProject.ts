import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '../github/client'
import { fetchProject } from '../github/project'
import type { ProjectSnapshot } from '../types'

interface Args {
  host: string
  owner: string
  number: number
  columnField: string
  refreshIntervalSeconds?: number
}

interface State {
  snapshot: ProjectSnapshot | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useProject({
  host,
  owner,
  number,
  columnField,
  refreshIntervalSeconds,
}: Args): State {
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const inFlightRef = useRef(false)

  const reload = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: tick drives manual reload
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (inFlightRef.current) return
      inFlightRef.current = true
      setLoading(true)
      try {
        const client = await createClient(host)
        const snap = await fetchProject(client, owner, number, columnField)
        if (!cancelled) {
          setSnapshot(snap)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
        inFlightRef.current = false
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [host, owner, number, columnField, tick])

  useEffect(() => {
    if (!refreshIntervalSeconds || refreshIntervalSeconds <= 0) return
    const id = setInterval(() => reload(), refreshIntervalSeconds * 1000)
    return () => clearInterval(id)
  }, [refreshIntervalSeconds, reload])

  return { snapshot, loading, error, reload }
}
