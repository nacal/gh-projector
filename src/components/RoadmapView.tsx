import { Box, Text } from 'ink'
import type { Item } from '../types'
import { groupByParent } from '../utils/grouping'
import { padEnd, truncateByWidth } from '../utils/string'

export type ZoomLevel = 'day' | 'week' | 'month'

interface Props {
  items: Item[]
  selectedIndex: number
  width: number
  height: number
  zoom: ZoomLevel
  scrollOffset: number
  columnFieldId: string
  collapsedGroups: Set<string>
  onToggleCollapse: (groupId: string) => void
}

interface DateRange {
  start: Date
  end: Date
}

const DAY_MS = 86400000

function parseDateFields(item: Item): DateRange | null {
  const dates: string[] = []
  for (const f of item.extraFields) {
    if (/^\d{4}-\d{2}-\d{2}/.test(f.text)) {
      dates.push(f.text)
    }
  }
  if (dates.length === 0) return null
  dates.sort()
  const start = new Date(dates[0]!)
  const end =
    dates.length >= 2 ? new Date(dates[dates.length - 1]!) : new Date(start.getTime() + 7 * DAY_MS)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return { start, end: end >= start ? end : start }
}

function viewportDays(zoom: ZoomLevel): number {
  switch (zoom) {
    case 'day':
      return 30
    case 'week':
      return 90
    case 'month':
      return 365
  }
}

function scrollStepDays(zoom: ZoomLevel): number {
  switch (zoom) {
    case 'day':
      return 3
    case 'week':
      return 7
    case 'month':
      return 30
  }
}

function fmtShortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function dayToCol(day: Date, viewStart: Date, chartWidth: number, totalDays: number): number {
  const d = (day.getTime() - viewStart.getTime()) / DAY_MS
  return Math.round((d / totalDays) * chartWidth)
}

// Compute aggregate date range for a group header from parent + children
function computeAggregateRange(items: Item[]): DateRange | null {
  const allRanges = items.map(parseDateFields).filter((r): r is DateRange => r !== null)
  if (allRanges.length === 0) return null
  return {
    start: new Date(Math.min(...allRanges.map((r) => r.start.getTime()))),
    end: new Date(Math.max(...allRanges.map((r) => r.end.getTime()))),
  }
}

function buildBar(
  range: DateRange | null,
  chartWidth: number,
  todayCol: number,
  viewStart: Date,
  totalDays: number,
): string[] {
  const barChars: string[] = Array.from({ length: chartWidth }, () => ' ')
  if (todayCol >= 0 && todayCol < chartWidth) barChars[todayCol] = '│'
  if (range) {
    const barStart = Math.max(0, dayToCol(range.start, viewStart, chartWidth, totalDays))
    const barEnd = Math.min(chartWidth - 1, dayToCol(range.end, viewStart, chartWidth, totalDays))
    for (let col = barStart; col <= barEnd; col++) {
      barChars[col] = col === todayCol ? '┃' : '█'
    }
  }
  return barChars
}

export function RoadmapView({
  items,
  selectedIndex,
  width,
  height,
  zoom,
  scrollOffset,
  columnFieldId,
  collapsedGroups,
}: Props) {
  const labelWidth = Math.min(28, Math.max(12, Math.floor(width * 0.2)))
  const statusWidth = 12
  const chartWidth = Math.max(10, width - labelWidth - statusWidth - 4)
  const totalDays = viewportDays(zoom)
  const stepDays = scrollStepDays(zoom)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const viewStart = new Date(today.getTime() + scrollOffset * stepDays * DAY_MS)
  const viewEnd = new Date(viewStart.getTime() + totalDays * DAY_MS)

  const rows = groupByParent(items, collapsedGroups)

  // Header
  const headerChars: string[] = Array.from({ length: chartWidth }, () => ' ')
  const rulerChars: string[] = Array.from({ length: chartWidth }, () => '─')

  const firstMonth = new Date(viewStart.getFullYear(), viewStart.getMonth(), 1)
  const cursor = new Date(firstMonth)
  while (cursor <= viewEnd) {
    const col = dayToCol(cursor, viewStart, chartWidth, totalDays)
    if (col >= 0 && col < chartWidth) {
      const yr = cursor.getFullYear()
      const label =
        zoom === 'month'
          ? `${MONTH_NAMES[cursor.getMonth()]} ${yr}`
          : `${MONTH_NAMES[cursor.getMonth()]}${cursor.getMonth() === 0 ? ` ${yr}` : ''}`
      for (let i = 0; i < label.length && col + i < chartWidth; i++) {
        headerChars[col + i] = label[i]!
      }
      rulerChars[col] = '┬'
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }

  const todayCol = dayToCol(today, viewStart, chartWidth, totalDays)
  if (todayCol >= 0 && todayCol < chartWidth) rulerChars[todayCol] = '▼'

  // Windowed scrolling
  const maxVisibleRows = Math.max(1, height - 5)
  let start = 0
  if (rows.length > maxVisibleRows) {
    start = Math.max(
      0,
      Math.min(rows.length - maxVisibleRows, selectedIndex - Math.floor(maxVisibleRows / 2)),
    )
  }
  const visible = rows.slice(start, start + maxVisibleRows)

  return (
    <Box flexDirection="column" width={width} height={height}>
      <Box>
        <Text dimColor>{padEnd('', labelWidth)} │</Text>
        <Text dimColor>{headerChars.join('')}</Text>
      </Box>
      <Box>
        <Text dimColor>{padEnd('', labelWidth)} │</Text>
        <Text dimColor>{rulerChars.join('')}</Text>
      </Box>

      {rows.length === 0 && <Text dimColor>(no items)</Text>}
      {start > 0 && <Text dimColor>↑ {start} more</Text>}
      {visible.map((row, i) => {
        const absIndex = start + i
        const selected = absIndex === selectedIndex
        const indentStr = row.indent > 0 ? '  '.repeat(row.indent) : ''
        const collapseIcon = row.isGroupHeader ? (row.collapsed ? '▶ ' : '▼ ') : ''
        const prefix = `${indentStr}${collapseIcon}`
        const titleText = `${row.item.content.number ? `#${row.item.content.number} ` : ''}${row.item.content.title}`
        const label = truncateByWidth(`${prefix}${titleText}`, labelWidth)
        const status = truncateByWidth(
          row.item.singleSelectValues[columnFieldId]?.optionName ?? '',
          statusWidth,
        )

        // Group headers show aggregate range
        const itemRange = parseDateFields(row.item)
        let displayRange = itemRange
        if (row.isGroupHeader) {
          // Find children in visible + full items list and compute aggregate
          const childItems = items.filter(
            (it) => it.content.parentNumber === row.item.content.number,
          )
          displayRange = computeAggregateRange([row.item, ...childItems]) ?? itemRange
        }
        const barChars = buildBar(displayRange, chartWidth, todayCol, viewStart, totalDays)

        const barColor = displayRange
          ? row.isGroupHeader
            ? 'blue'
            : row.item.content.state === 'CLOSED' || row.item.content.state === 'MERGED'
              ? 'gray'
              : 'cyan'
          : undefined

        return (
          <Box key={`${row.item.id}-${row.indent}`}>
            <Text bold={selected || row.isGroupHeader} color={selected ? 'cyan' : undefined}>
              {padEnd(label, labelWidth)}
            </Text>
            <Text dimColor> │</Text>
            <Text color={selected ? 'white' : barColor} dimColor={!displayRange}>
              {barChars.join('')}
            </Text>
            <Text dimColor> {padEnd(status, statusWidth)}</Text>
          </Box>
        )
      })}
      {start + visible.length < rows.length && (
        <Text dimColor>↓ {rows.length - (start + visible.length)} more</Text>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          zoom: {zoom} ({totalDays}d) · ←/→ scroll · +/- zoom · t today · Tab fold · today:{' '}
          {fmtShortDate(today)}
        </Text>
      </Box>
    </Box>
  )
}
