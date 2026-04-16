import { useCallback, useEffect, useRef, useState } from 'react'
import type { GraphQLClient } from '../github/client'
import { createClient } from '../github/client'
import { addDraftIssue, archiveItem, updateItemStatus } from '../github/mutations'
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
  moveItem: (
    itemId: string,
    targetOptionId: string,
    targetOptionName: string,
    fieldId: string,
  ) => Promise<void>
  createDraft: (title: string, body?: string) => Promise<void>
  archiveItem: (itemId: string) => Promise<void>
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
  const clientRef = useRef<GraphQLClient | null>(null)

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
        clientRef.current = client
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

  const moveItem = useCallback(
    async (itemId: string, targetOptionId: string, targetOptionName: string, fieldId: string) => {
      const client = clientRef.current
      const snap = snapshot
      if (!client || !snap) return

      setSnapshot((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  singleSelectValues: {
                    ...it.singleSelectValues,
                    [fieldId]: { optionId: targetOptionId, optionName: targetOptionName },
                  },
                }
              : it,
          ),
        }
      })

      try {
        await updateItemStatus(client, snap.projectId, itemId, fieldId, targetOptionId)
      } catch (e) {
        setError((e as Error).message)
        setSnapshot(snap)
      }
    },
    [snapshot],
  )

  const createDraft = useCallback(
    async (title: string, body?: string) => {
      const client = clientRef.current
      const snap = snapshot
      if (!client || !snap) return
      try {
        await addDraftIssue(client, snap.projectId, title, body)
        reload()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    [snapshot, reload],
  )

  const doArchiveItem = useCallback(
    async (itemId: string) => {
      const client = clientRef.current
      const snap = snapshot
      if (!client || !snap) return

      // optimistic remove
      setSnapshot((prev) => {
        if (!prev) return prev
        return { ...prev, items: prev.items.filter((it) => it.id !== itemId) }
      })

      try {
        await archiveItem(client, snap.projectId, itemId)
      } catch (e) {
        setError((e as Error).message)
        setSnapshot(snap)
      }
    },
    [snapshot],
  )

  return {
    snapshot,
    loading,
    error,
    reload,
    moveItem,
    createDraft,
    archiveItem: doArchiveItem,
  }
}
