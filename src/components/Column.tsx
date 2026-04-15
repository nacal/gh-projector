import { Box, Text } from 'ink'
import type { Item } from '../types'
import { Card } from './Card'

interface Props {
  name: string
  items: Item[]
  width: number
  focused: boolean
  selectedItemIndex: number
  maxVisibleItems: number
}

export function Column({ name, items, width, focused, selectedItemIndex, maxVisibleItems }: Props) {
  const headerColor = focused ? 'cyan' : 'white'

  // simple windowing around selection
  let start = 0
  if (items.length > maxVisibleItems) {
    start = Math.max(
      0,
      Math.min(items.length - maxVisibleItems, selectedItemIndex - Math.floor(maxVisibleItems / 2)),
    )
  }
  const visible = items.slice(start, start + maxVisibleItems)

  return (
    <Box flexDirection="column" width={width} marginRight={1}>
      <Box>
        <Text bold color={headerColor}>
          {name} ({items.length})
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {visible.map((item, i) => {
          const absIndex = start + i
          return (
            <Box key={item.id} marginBottom={0}>
              <Card
                item={item}
                width={width - 1}
                selected={focused && absIndex === selectedItemIndex}
              />
            </Box>
          )
        })}
        {items.length === 0 && <Text dimColor>(empty)</Text>}
        {start + visible.length < items.length && (
          <Text dimColor>↓ {items.length - (start + visible.length)} more</Text>
        )}
        {start > 0 && <Text dimColor>↑ {start} more</Text>}
      </Box>
    </Box>
  )
}
