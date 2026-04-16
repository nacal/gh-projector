import { Box, Text } from 'ink'
import type { ProjectView } from '../types'

interface Props {
  views: ProjectView[]
  activeViewId: string | null
  highlightIndex: number
  width: number
}

function layoutIcon(layout: ProjectView['layout']): string {
  switch (layout) {
    case 'BOARD_LAYOUT':
      return '▦'
    case 'TABLE_LAYOUT':
      return '☰'
    case 'ROADMAP_LAYOUT':
      return '▬▬'
  }
}

function layoutName(layout: ProjectView['layout']): string {
  switch (layout) {
    case 'BOARD_LAYOUT':
      return 'board'
    case 'TABLE_LAYOUT':
      return 'table'
    case 'ROADMAP_LAYOUT':
      return 'roadmap'
  }
}

export function ViewPicker({ views, activeViewId, highlightIndex, width }: Props) {
  return (
    <Box
      borderStyle="double"
      borderColor="cyan"
      flexDirection="column"
      paddingX={2}
      paddingY={1}
      width={Math.min(width - 4, 80)}
    >
      <Text bold>Select view</Text>
      <Box flexDirection="column" marginTop={1}>
        {views.length === 0 ? (
          <Text dimColor>(no views available)</Text>
        ) : (
          views.map((v, i) => {
            const active = v.id === activeViewId
            const highlighted = i === highlightIndex
            return (
              <Box key={v.id}>
                <Text color={highlighted ? 'cyan' : undefined} bold={highlighted}>
                  {highlighted ? '▶ ' : '  '}
                </Text>
                <Text color={highlighted ? 'cyan' : undefined} bold={active}>
                  {active ? '● ' : '○ '}
                  {v.name}
                </Text>
                <Text dimColor>{` [${layoutIcon(v.layout)} ${layoutName(v.layout)}]`}</Text>
              </Box>
            )
          })
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>↑/↓ navigate · Enter select · Esc cancel</Text>
      </Box>
    </Box>
  )
}
