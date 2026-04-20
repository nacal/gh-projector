import { Box } from 'ink'
import type { Item, ProjectSnapshot, SingleSelectFieldDef } from '../types'
import { type GroupedRow, groupByParent } from '../utils/grouping'
import { Column } from './Column'

export const NO_STATUS_ID = '__no_status__'

export interface ColumnGroup {
  id: string
  name: string
  items: Item[]
  rows: GroupedRow[]
}

interface Props {
  snapshot: ProjectSnapshot
  columnField: SingleSelectFieldDef
  columnIndex: number
  itemIndex: number
  width: number
  height: number
  collapsedGroups: Set<string>
}

export function groupItems(
  snapshot: ProjectSnapshot,
  columnField: SingleSelectFieldDef,
  collapsedGroups: Set<string>,
): ColumnGroup[] {
  const byOption = new Map<string, Item[]>()
  for (const opt of columnField.options) byOption.set(opt.id, [])
  const noStatus: Item[] = []
  for (const item of snapshot.items) {
    const value = item.singleSelectValues[columnField.id]
    if (value && byOption.has(value.optionId)) {
      byOption.get(value.optionId)!.push(item)
    } else {
      noStatus.push(item)
    }
  }
  const cols: ColumnGroup[] = columnField.options.map((c) => {
    const items = byOption.get(c.id) ?? []
    return { id: c.id, name: c.name, items, rows: groupByParent(items, collapsedGroups) }
  })
  if (noStatus.length > 0) {
    cols.push({
      id: NO_STATUS_ID,
      name: 'No Status',
      items: noStatus,
      rows: groupByParent(noStatus, collapsedGroups),
    })
  }
  return cols
}

export function Board({
  snapshot,
  columnField,
  columnIndex,
  itemIndex,
  width,
  height,
  collapsedGroups,
}: Props) {
  const cols = groupItems(snapshot, columnField, collapsedGroups)
  const colCount = Math.max(1, cols.length)
  const colWidth = Math.max(20, Math.floor((width - colCount) / colCount))

  const maxVisibleItems = Math.max(1, Math.floor((height - 3) / 5))

  return (
    <Box flexDirection="row" width={width} height={height}>
      {cols.map((col, i) => (
        <Column
          key={col.id}
          name={col.name}
          rows={col.rows}
          width={colWidth}
          focused={i === columnIndex}
          selectedRowIndex={i === columnIndex ? itemIndex : -1}
          maxVisibleItems={maxVisibleItems}
          singleSelectFields={snapshot.fields}
          columnFieldId={columnField.id}
        />
      ))}
    </Box>
  )
}
