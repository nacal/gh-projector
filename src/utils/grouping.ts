import type { Item } from '../types'

export interface GroupedRow {
  item: Item
  indent: number
  isGroupHeader: boolean
  groupId: string | null
  collapsed: boolean
  childCount: number
}

export function groupByParent(items: Item[], collapsedGroups: Set<string>): GroupedRow[] {
  const childrenByParent = new Map<string, Item[]>()
  const orphans: Item[] = []
  const parentIds = new Set<string>()

  const itemsByNumber = new Map<number, Item>()
  for (const it of items) {
    if (it.content.number !== undefined) {
      itemsByNumber.set(it.content.number, it)
    }
  }

  for (const it of items) {
    const pNum = it.content.parentNumber
    if (pNum !== undefined && itemsByNumber.has(pNum)) {
      const parent = itemsByNumber.get(pNum)!
      if (!childrenByParent.has(parent.id)) childrenByParent.set(parent.id, [])
      childrenByParent.get(parent.id)!.push(it)
      parentIds.add(parent.id)
    } else {
      orphans.push(it)
    }
  }

  const rows: GroupedRow[] = []

  for (const parentItem of items) {
    if (!parentIds.has(parentItem.id)) continue
    const children = childrenByParent.get(parentItem.id) ?? []
    const collapsed = collapsedGroups.has(parentItem.id)

    rows.push({
      item: parentItem,
      indent: 0,
      isGroupHeader: true,
      groupId: parentItem.id,
      collapsed,
      childCount: children.length,
    })

    if (!collapsed) {
      for (const child of children) {
        rows.push({
          item: child,
          indent: 1,
          isGroupHeader: false,
          groupId: parentItem.id,
          collapsed: false,
          childCount: 0,
        })
      }
    }
  }

  for (const it of orphans) {
    if (parentIds.has(it.id)) continue
    rows.push({
      item: it,
      indent: 0,
      isGroupHeader: false,
      groupId: null,
      collapsed: false,
      childCount: 0,
    })
  }

  return rows
}
