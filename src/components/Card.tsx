import { Box, Text } from 'ink'
import type { Item } from '../types'

interface Props {
  item: Item
  width: number
  selected: boolean
}

function kindIcon(kind: Item['content']['kind']): string {
  switch (kind) {
    case 'Issue':
      return '◉'
    case 'PullRequest':
      return '⇅'
    case 'DraftIssue':
      return '✎'
  }
}

function truncate(s: string, max: number): string {
  if (max <= 1) return s.slice(0, max)
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

export function Card({ item, width, selected }: Props) {
  const inner = Math.max(1, width - 4)
  const c = item.content
  const numberStr = c.number !== undefined ? `#${c.number} ` : ''
  const header = `${kindIcon(c.kind)} ${numberStr}${c.title}`
  const assignees = c.assignees.map((a) => `@${a.login}`).join(' ')
  const labels = c.labels.map((l) => l.name).join(', ')
  const extras = item.extraFields.map((f) => `${f.fieldName}: ${f.text}`).join(' · ')
  const metaLines = [assignees, labels, extras].filter((s) => s.length > 0)

  return (
    <Box
      borderStyle={selected ? 'round' : 'single'}
      borderColor={selected ? 'cyan' : 'gray'}
      flexDirection="column"
      width={width}
      paddingX={1}
    >
      <Text bold={selected} wrap="truncate">
        {truncate(header, inner)}
      </Text>
      {metaLines.map((line) => (
        <Text key={line} color="gray" wrap="truncate">
          {truncate(line, inner)}
        </Text>
      ))}
    </Box>
  )
}
