import type { Item } from '../types'

export type SortKey = 'manual' | 'title' | 'updated' | 'created' | 'assignee'

export const SORT_KEYS: SortKey[] = ['manual', 'title', 'updated', 'created', 'assignee']

export function sortLabel(key: SortKey): string {
  switch (key) {
    case 'manual':
      return 'manual (project order)'
    case 'title':
      return 'title'
    case 'updated':
      return 'recently updated'
    case 'created':
      return 'recently created'
    case 'assignee':
      return 'assignee'
  }
}

export function sortItems(items: Item[], key: SortKey): Item[] {
  if (key === 'manual') return items
  const sorted = [...items]
  sorted.sort((a, b) => {
    switch (key) {
      case 'title':
        return a.content.title.localeCompare(b.content.title)
      case 'updated': {
        const au = a.content.updatedAt ?? ''
        const bu = b.content.updatedAt ?? ''
        return bu.localeCompare(au) // newest first
      }
      case 'created': {
        const ac = a.content.createdAt ?? ''
        const bc = b.content.createdAt ?? ''
        return bc.localeCompare(ac) // newest first
      }
      case 'assignee': {
        const aa = a.content.assignees[0]?.login ?? '\uffff'
        const ba = b.content.assignees[0]?.login ?? '\uffff'
        return aa.localeCompare(ba)
      }
    }
  })
  return sorted
}
