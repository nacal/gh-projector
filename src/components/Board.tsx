import { Box } from 'ink'
import type { Item, ProjectSnapshot } from '../types'
import { Column } from './Column'

export const NO_STATUS_ID = '__no_status__'

interface Props {
  snapshot: ProjectSnapshot
  columnIndex: number
  itemIndex: number
  width: number
  height: number
}

export function groupItems(
  snapshot: ProjectSnapshot,
): { id: string; name: string; items: Item[] }[] {
  const byOption = new Map<string, Item[]>()
  for (const col of snapshot.columns) byOption.set(col.id, [])
  const noStatus: Item[] = []
  for (const item of snapshot.items) {
    if (item.statusOptionId && byOption.has(item.statusOptionId)) {
      byOption.get(item.statusOptionId)!.push(item)
    } else {
      noStatus.push(item)
    }
  }
  const cols = snapshot.columns.map((c) => ({
    id: c.id,
    name: c.name,
    items: byOption.get(c.id) ?? [],
  }))
  if (noStatus.length > 0) {
    cols.push({ id: NO_STATUS_ID, name: 'No Status', items: noStatus })
  }
  return cols
}

export function Board({ snapshot, columnIndex, itemIndex, width, height }: Props) {
  const cols = groupItems(snapshot)
  const colCount = Math.max(1, cols.length)
  const colWidth = Math.max(20, Math.floor((width - colCount) / colCount))

  // each card is ~4 rows (border + 1 title + up to 2 meta), plus header 2 rows
  const maxVisibleItems = Math.max(1, Math.floor((height - 3) / 5))

  return (
    <Box flexDirection="row" width={width} height={height}>
      {cols.map((col, i) => (
        <Column
          key={col.id}
          name={col.name}
          items={col.items}
          width={colWidth}
          focused={i === columnIndex}
          selectedItemIndex={i === columnIndex ? itemIndex : -1}
          maxVisibleItems={maxVisibleItems}
        />
      ))}
    </Box>
  )
}
