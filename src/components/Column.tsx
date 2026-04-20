import { Box, Text } from 'ink'
import type { SingleSelectFieldDef } from '../types'
import type { GroupedRow } from '../utils/grouping'
import { Card } from './Card'

interface Props {
  name: string
  rows: GroupedRow[]
  width: number
  focused: boolean
  selectedRowIndex: number
  maxVisibleItems: number
  singleSelectFields: SingleSelectFieldDef[]
  columnFieldId: string
}

export function Column({
  name,
  rows,
  width,
  focused,
  selectedRowIndex,
  maxVisibleItems,
  singleSelectFields,
  columnFieldId,
}: Props) {
  const headerColor = focused ? 'cyan' : 'white'
  const totalItems = rows.length

  let start = 0
  if (totalItems > maxVisibleItems) {
    start = Math.max(
      0,
      Math.min(totalItems - maxVisibleItems, selectedRowIndex - Math.floor(maxVisibleItems / 2)),
    )
  }
  const visible = rows.slice(start, start + maxVisibleItems)

  return (
    <Box flexDirection="column" width={width} marginRight={1}>
      <Box>
        <Text bold color={headerColor}>
          {name} ({totalItems})
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {visible.map((row, i) => {
          const absIndex = start + i
          const selected = focused && absIndex === selectedRowIndex
          const cardWidth = Math.max(1, width - 1 - row.indent * 2)
          return (
            <Box key={row.item.id} marginBottom={0} paddingLeft={row.indent * 2}>
              {row.isGroupHeader && (
                <Box>
                  <Text color={selected ? 'cyan' : 'white'} bold>
                    {row.collapsed ? '▶ ' : '▼ '}
                  </Text>
                </Box>
              )}
              {!row.isGroupHeader && row.indent > 0 && (
                <Box>
                  <Text dimColor>{'  '}</Text>
                </Box>
              )}
              <Card
                item={row.item}
                width={cardWidth - (row.isGroupHeader ? 2 : row.indent > 0 ? 2 : 0)}
                selected={selected}
                singleSelectFields={singleSelectFields}
                columnFieldId={columnFieldId}
              />
            </Box>
          )
        })}
        {totalItems === 0 && <Text dimColor>(empty)</Text>}
        {start + visible.length < totalItems && (
          <Text dimColor>↓ {totalItems - (start + visible.length)} more</Text>
        )}
        {start > 0 && <Text dimColor>↑ {start} more</Text>}
      </Box>
    </Box>
  )
}
