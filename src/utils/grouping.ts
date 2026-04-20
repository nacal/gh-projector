import type { Item } from '../types'

export interface GroupedRow {
  item: Item
  indent: number
  isGroupHeader: boolean
  groupId: string | null
  collapsed: boolean
  childCount: number
  /** For virtual parent headers: the parent's number and title (when parent is not in project). */
  virtualParentLabel: string | null
}

export function groupByParent(items: Item[], collapsedGroups: Set<string>): GroupedRow[] {
  // Build lookup of items by their issue number
  const itemsByNumber = new Map<number, Item>()
  for (const it of items) {
    if (it.content.number !== undefined) {
      itemsByNumber.set(it.content.number, it)
    }
  }

  // Group children by parent number (not parent item ID)
  // This works whether or not the parent is in the project
  const childrenByParentNum = new Map<number, Item[]>()
  const childItemIds = new Set<string>()

  for (const it of items) {
    const pNum = it.content.parentNumber
    if (pNum === undefined) continue
    if (!childrenByParentNum.has(pNum)) childrenByParentNum.set(pNum, [])
    childrenByParentNum.get(pNum)!.push(it)
    childItemIds.add(it.id)
  }

  const rows: GroupedRow[] = []
  const emittedIds = new Set<string>()

  // Emit groups: for each unique parentNumber, emit a header + children
  for (const [parentNum, children] of childrenByParentNum) {
    if (children.length === 0) continue
    const parentItem = itemsByNumber.get(parentNum)
    const groupId = parentItem ? parentItem.id : `virtual-parent-${parentNum}`
    const collapsed = collapsedGroups.has(groupId)

    if (parentItem) {
      // Parent is in the project — use it as the header
      rows.push({
        item: parentItem,
        indent: 0,
        isGroupHeader: true,
        groupId,
        collapsed,
        childCount: children.length,
        virtualParentLabel: null,
      })
      emittedIds.add(parentItem.id)
    } else {
      // Parent is NOT in the project — create a virtual header using the first child's parentTitle
      const firstChild = children[0]!
      const label = firstChild.content.parentTitle
        ? `#${parentNum} ${firstChild.content.parentTitle}`
        : `#${parentNum}`
      // Use first child as the "item" for the header row (for selection/navigation)
      // but mark it as virtual
      rows.push({
        item: firstChild,
        indent: 0,
        isGroupHeader: true,
        groupId,
        collapsed,
        childCount: children.length,
        virtualParentLabel: label,
      })
    }

    if (!collapsed) {
      for (const child of children) {
        rows.push({
          item: child,
          indent: 1,
          isGroupHeader: false,
          groupId,
          collapsed: false,
          childCount: 0,
          virtualParentLabel: null,
        })
        emittedIds.add(child.id)
      }
    } else {
      for (const child of children) {
        emittedIds.add(child.id)
      }
    }
  }

  // Orphans: items that have no parent and are not already emitted
  for (const it of items) {
    if (emittedIds.has(it.id)) continue
    if (it.content.parentNumber !== undefined) continue // child of something, already handled
    rows.push({
      item: it,
      indent: 0,
      isGroupHeader: false,
      groupId: null,
      collapsed: false,
      childCount: 0,
      virtualParentLabel: null,
    })
  }

  return rows
}
