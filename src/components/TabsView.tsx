import { Box, Text } from 'ink'
import type { Item, SingleSelectFieldDef } from '../types'
import { Card } from './Card'

interface ColumnGroup {
  id: string
  name: string
  items: Item[]
}

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

  const maxVisibleItems = Math.max(1, Math.floor((height - 3) / 5))
  let start = 0
  if (col && col.items.length > maxVisibleItems) {
    start = Math.max(
      0,
      Math.min(col.items.length - maxVisibleItems, itemIndex - Math.floor(maxVisibleItems / 2)),
    )
  }
  const visible = col ? col.items.slice(start, start + maxVisibleItems) : []

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
                {` ${c.name} (${c.items.length}) `}
              </Text>
            </Box>
          )
        })}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {col && col.items.length === 0 && <Text dimColor>(empty)</Text>}
        {start > 0 && <Text dimColor>↑ {start} more</Text>}
        {visible.map((item, i) => {
          const absIndex = start + i
          return (
            <Card
              key={item.id}
              item={item}
              width={width - 1}
              selected={absIndex === itemIndex}
              singleSelectFields={singleSelectFields}
              columnFieldId={columnFieldId}
            />
          )
        })}
        {col && start + visible.length < col.items.length && (
          <Text dimColor>↓ {col.items.length - (start + visible.length)} more</Text>
        )}
      </Box>
    </Box>
  )
}
