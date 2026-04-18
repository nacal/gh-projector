import { Box, Text } from 'ink'
import type { Item, SingleSelectFieldDef } from '../types'

interface Props {
  items: Item[]
  selectedIndex: number
  width: number
  height: number
  fields: SingleSelectFieldDef[]
  columnFieldId: string
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

function stateShort(state: string | undefined, kind: Item['content']['kind']): string {
  if (kind === 'DraftIssue') return 'DRFT'
  if (!state) return ''
  if (state === 'OPEN') return 'OPEN'
  if (state === 'CLOSED') return 'CLSD'
  if (state === 'MERGED') return 'MRGD'
  return state.slice(0, 4)
}

function stateColor(state: string | undefined): string | undefined {
  if (!state) return undefined
  if (state === 'OPEN') return 'green'
  if (state === 'CLOSED') return 'red'
  if (state === 'MERGED') return 'magenta'
  return undefined
}

function truncate(s: string, max: number): string {
  if (max <= 0) return ''
  if (max <= 1) return s.slice(0, 1)
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

function pad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + ' '.repeat(width - s.length)
}

interface ColDef {
  header: string
  width: number
  getValue: (item: Item) => string
  getColor?: (item: Item) => string | undefined
}

function buildColumns(
  width: number,
  fields: SingleSelectFieldDef[],
  columnFieldId: string,
): ColDef[] {
  const cols: ColDef[] = []

  // # + type
  cols.push({
    header: '#',
    width: 8,
    getValue: (item) => {
      const n = item.content.number
      return `${kindIcon(item.content.kind)} ${n !== undefined ? `#${n}` : '--'}`
    },
  })

  // State
  cols.push({
    header: 'State',
    width: 6,
    getValue: (item) => stateShort(item.content.state, item.content.kind),
    getColor: (item) => stateColor(item.content.state),
  })

  // Status (column field value)
  const colField = fields.find((f) => f.id === columnFieldId)
  if (colField) {
    cols.push({
      header: colField.name,
      width: 16,
      getValue: (item) => item.singleSelectValues[columnFieldId]?.optionName ?? '',
    })
  }

  // Assignees
  cols.push({
    header: 'Assignees',
    width: 14,
    getValue: (item) => item.content.assignees.map((a) => a.login).join(', '),
  })

  // Other SingleSelect fields
  for (const f of fields) {
    if (f.id === columnFieldId) continue
    cols.push({
      header: f.name,
      width: 14,
      getValue: (item) => item.singleSelectValues[f.id]?.optionName ?? '',
    })
  }

  // Title gets remaining width (min 20)
  const fixedWidth = cols.reduce((sum, c) => sum + c.width + 1, 0) // +1 for separator
  const titleWidth = Math.max(20, width - fixedWidth - 1)

  // Insert title at position 1 (after #)
  cols.splice(1, 0, {
    header: 'Title',
    width: titleWidth,
    getValue: (item) => item.content.title,
  })

  return cols
}

export function TableView({ items, selectedIndex, width, height, fields, columnFieldId }: Props) {
  const cols = buildColumns(width, fields, columnFieldId)
  const maxVisibleRows = Math.max(1, height - 3) // header + border + padding

  let start = 0
  if (items.length > maxVisibleRows) {
    start = Math.max(
      0,
      Math.min(items.length - maxVisibleRows, selectedIndex - Math.floor(maxVisibleRows / 2)),
    )
  }
  const visible = items.slice(start, start + maxVisibleRows)

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <Box>
        {cols.map((col) => (
          <Box key={col.header} width={col.width + 1}>
            <Text bold dimColor>
              {pad(col.header, col.width)}
            </Text>
          </Box>
        ))}
      </Box>
      <Box>
        <Text dimColor>
          {'─'.repeat(
            Math.min(
              width,
              cols.reduce((s, c) => s + c.width + 1, 0),
            ),
          )}
        </Text>
      </Box>

      {/* Rows */}
      {items.length === 0 && <Text dimColor>(no items)</Text>}
      {start > 0 && <Text dimColor>↑ {start} more</Text>}
      {visible.map((item, i) => {
        const absIndex = start + i
        const selected = absIndex === selectedIndex
        return (
          <Box key={item.id}>
            {cols.map((col) => {
              const val = truncate(col.getValue(item), col.width)
              const color = col.getColor?.(item)
              return (
                <Box key={col.header} width={col.width + 1}>
                  <Text bold={selected} color={selected ? 'cyan' : color} inverse={selected}>
                    {pad(val, col.width)}
                  </Text>
                </Box>
              )
            })}
          </Box>
        )
      })}
      {start + visible.length < items.length && (
        <Text dimColor>↓ {items.length - (start + visible.length)} more</Text>
      )}
    </Box>
  )
}
