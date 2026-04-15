import { Box, Text } from 'ink'
import type { Item } from '../types'

interface Props {
  item: Item
  columnName: string | null
  width: number
  height: number
  scrollOffset: number
}

function kindLabel(kind: Item['content']['kind']): string {
  switch (kind) {
    case 'Issue':
      return 'Issue'
    case 'PullRequest':
      return 'Pull Request'
    case 'DraftIssue':
      return 'Draft'
  }
}

function stateColor(state: string | undefined): string | undefined {
  if (!state) return undefined
  if (state === 'OPEN') return 'green'
  if (state === 'CLOSED') return 'red'
  if (state === 'MERGED') return 'magenta'
  return undefined
}

export function DetailView({ item, columnName, width, height, scrollOffset }: Props) {
  const c = item.content
  const header = `${kindLabel(c.kind)}${c.number !== undefined ? ` #${c.number}` : ''}`

  const bodyLines = (c.body ?? '').replace(/\r\n/g, '\n').split('\n')
  const bodyHeight = Math.max(1, height - 12)
  const visibleBody = bodyLines.slice(scrollOffset, scrollOffset + bodyHeight)
  const hasMoreBelow = scrollOffset + bodyHeight < bodyLines.length
  const hasMoreAbove = scrollOffset > 0

  return (
    <Box flexDirection="column" width={width} height={height} paddingX={1}>
      <Box>
        <Text dimColor>{header}</Text>
        {c.state && (
          <Text color={stateColor(c.state)} bold>
            {'  '}
            {c.state}
          </Text>
        )}
        {columnName && <Text dimColor>{`   [${columnName}]`}</Text>}
      </Box>
      <Box marginTop={1}>
        <Text bold>{c.title}</Text>
      </Box>
      {c.url && (
        <Box>
          <Text color="blue">{c.url}</Text>
        </Box>
      )}
      {c.assignees.length > 0 && (
        <Box marginTop={1}>
          <Text dimColor>Assignees: </Text>
          <Text>{c.assignees.map((a) => `@${a.login}`).join(' ')}</Text>
        </Box>
      )}
      {c.labels.length > 0 && (
        <Box>
          <Text dimColor>Labels: </Text>
          <Text>{c.labels.map((l) => l.name).join(', ')}</Text>
        </Box>
      )}
      {item.extraFields.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          {item.extraFields.map((f) => (
            <Box key={f.fieldName}>
              <Text dimColor>{f.fieldName}: </Text>
              <Text>{f.text}</Text>
            </Box>
          ))}
        </Box>
      )}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          ── body {hasMoreAbove ? '(↑ more above)' : ''} {hasMoreBelow ? '(↓ more below)' : ''}
        </Text>
        {visibleBody.length === 0 || (visibleBody.length === 1 && visibleBody[0] === '') ? (
          <Text dimColor>(no body)</Text>
        ) : (
          visibleBody.map((line, i) => {
            const key = `${scrollOffset + i}`
            return (
              <Text key={key} wrap="truncate-end">
                {line.length === 0 ? ' ' : line}
              </Text>
            )
          })
        )}
      </Box>
    </Box>
  )
}
