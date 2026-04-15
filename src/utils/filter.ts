import type { Item, ProjectSnapshot } from '../types'

export function matchesFilter(item: Item, filter: string): boolean {
  if (!filter) return true
  const f = filter.toLowerCase()
  const c = item.content
  if (c.title.toLowerCase().includes(f)) return true
  if (c.assignees.some((a) => a.login.toLowerCase().includes(f))) return true
  if (c.labels.some((l) => l.name.toLowerCase().includes(f))) return true
  return false
}

export function applyFilter(snapshot: ProjectSnapshot, filter: string): ProjectSnapshot {
  if (!filter) return snapshot
  return {
    ...snapshot,
    items: snapshot.items.filter((it) => matchesFilter(it, filter)),
  }
}
