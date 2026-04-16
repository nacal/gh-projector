import { Box, Text } from 'ink'
import type { Item, Label, SingleSelectFieldDef } from '../types'

interface Props {
  item: Item
  width: number
  selected: boolean
  /** All SingleSelect fields in the project (for rendering field names). */
  singleSelectFields: SingleSelectFieldDef[]
  /** Field ID currently used as columns; its value is already implied by position. */
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

interface Badge {
  text: string
  color: string
}

function stateBadge(item: Item): Badge | null {
  const kind = item.content.kind
  const state = item.content.state
  if (kind === 'DraftIssue') return { text: 'DRAFT', color: 'white' }
  if (!state) return null
  if (state === 'OPEN') return { text: 'OPEN', color: 'green' }
  if (state === 'CLOSED') return { text: 'CLOSED', color: 'red' }
  if (state === 'MERGED') return { text: 'MERGED', color: 'magenta' }
  return { text: state, color: 'white' }
}

function truncate(s: string, max: number): string {
  if (max <= 1) return s.slice(0, max)
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

function labelColor(label: Label): string {
  const hex = label.color?.replace(/^#/, '') ?? ''
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex}` : 'yellow'
}

export function Card({ item, width, selected, singleSelectFields, columnFieldId }: Props) {
  const inner = Math.max(1, width - 4)
  const c = item.content
  const badge = stateBadge(item)
  const numberStr = c.number !== undefined ? `#${c.number} ` : ''
  const headerText = `${kindIcon(c.kind)} ${numberStr}${c.title}`
  const assignees = c.assignees.map((a) => `@${a.login}`).join(' ')

  const extraSingleSelect: string[] = []
  for (const f of singleSelectFields) {
    if (f.id === columnFieldId) continue
    const v = item.singleSelectValues[f.id]
    if (v) extraSingleSelect.push(`${f.name}: ${v.optionName}`)
  }
  const extraOther = item.extraFields.map((f) => `${f.fieldName}: ${f.text}`)
  const extras = [...extraSingleSelect, ...extraOther].join(' · ')

  return (
    <Box
      borderStyle={selected ? 'round' : 'single'}
      borderColor={selected ? 'cyan' : 'gray'}
      flexDirection="column"
      width={width}
      paddingX={1}
    >
      <Box>
        {badge && (
          <Text bold color={badge.color}>
            {badge.text}{' '}
          </Text>
        )}
        <Text bold={selected} wrap="truncate">
          {truncate(headerText, Math.max(1, inner - (badge ? badge.text.length + 1 : 0)))}
        </Text>
      </Box>
      {assignees.length > 0 && (
        <Text dimColor wrap="truncate">
          {truncate(assignees, inner)}
        </Text>
      )}
      {c.labels.length > 0 && (
        <Box>
          {c.labels.map((l, i) => (
            <Text key={l.name} color={labelColor(l)}>
              {i > 0 ? ' ' : ''}
              {l.name}
            </Text>
          ))}
        </Box>
      )}
      {extras.length > 0 && (
        <Text dimColor wrap="truncate">
          {truncate(extras, inner)}
        </Text>
      )}
    </Box>
  )
}
