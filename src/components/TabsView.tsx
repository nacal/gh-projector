import { Box, Text } from 'ink'
import type { SingleSelectFieldDef } from '../types'
import type { ColumnGroup } from './Board'
import { Card } from './Card'

interface Props {
  columns: ColumnGroup[]
  columnIndex: number
  itemIndex: number
  width: number
  height: number
  singleSelectFields: SingleSelectFieldDef[]
  columnFieldId: string
}

export function TabsView({
  columns,
  columnIndex,
  itemIndex,
  width,
  height,
  singleSelectFields,
  columnFieldId,
}: Props) {
  const col = columns[columnIndex]
  const rows = col?.rows ?? []

  const maxVisibleItems = Math.max(1, Math.floor((height - 3) / 5))
  let start = 0
  if (rows.length > maxVisibleItems) {
    start = Math.max(
      0,
      Math.min(rows.length - maxVisibleItems, itemIndex - Math.floor(maxVisibleItems / 2)),
    )
  }
  const visible = rows.slice(start, start + maxVisibleItems)

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box>
        {columns.map((c, i) => {
          const active = i === columnIndex
          return (
            <Box key={c.id} marginRight={1}>
              <Text
                bold={active}
                color={active ? 'black' : 'white'}
                backgroundColor={active ? 'cyan' : undefined}
              >
                {` ${c.name} (${c.rows.length}) `}
              </Text>
            </Box>
          )
        })}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {rows.length === 0 && <Text dimColor>(empty)</Text>}
        {start > 0 && <Text dimColor>↑ {start} more</Text>}
        {visible.map((row, i) => {
          const absIndex = start + i
          const selected = absIndex === itemIndex
          return (
            <Box key={row.item.id} paddingLeft={row.indent * 2}>
              {row.isGroupHeader && (
                <Text color={selected ? 'cyan' : 'white'} bold>
                  {row.collapsed ? '▶ ' : '▼ '}
                </Text>
              )}
              {!row.isGroupHeader && row.indent > 0 && <Text dimColor>{'  '}</Text>}
              <Card
                item={row.item}
                width={
                  width - 1 - row.indent * 2 - (row.isGroupHeader ? 2 : row.indent > 0 ? 2 : 0)
                }
                selected={selected}
                singleSelectFields={singleSelectFields}
                columnFieldId={columnFieldId}
              />
            </Box>
          )
        })}
        {start + visible.length < rows.length && (
          <Text dimColor>↓ {rows.length - (start + visible.length)} more</Text>
        )}
      </Box>
    </Box>
  )
}
