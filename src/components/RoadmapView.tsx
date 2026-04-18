import { Box, Text } from 'ink'
import type { Item } from '../types'
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

// Use display-width-aware truncate and pad from utils/string

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

interface RoadmapItem {
  item: Item
  range: DateRange | null
}

export function RoadmapView({
  items,
  selectedIndex,
  width,
  height,
  zoom,
  scrollOffset,
  columnFieldId,
}: Props) {
  const labelWidth = Math.min(28, Math.max(12, Math.floor(width * 0.2)))
  const statusWidth = 12
  const chartWidth = Math.max(10, width - labelWidth - statusWidth - 4)
  const totalDays = viewportDays(zoom)
  const stepDays = scrollStepDays(zoom)

  const roadmapItems: RoadmapItem[] = items.map((item) => ({
    item,
    range: parseDateFields(item),
  }))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Viewport start: today + scrollOffset * stepDays (negative = past)
  const viewStart = new Date(today.getTime() + scrollOffset * stepDays * DAY_MS)
  const viewEnd = new Date(viewStart.getTime() + totalDays * DAY_MS)

  // Build header with month labels at boundaries
  const headerChars: string[] = Array.from({ length: chartWidth }, () => ' ')
  const rulerChars: string[] = Array.from({ length: chartWidth }, () => '─')

  // Place month labels
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

  // Today marker
  const todayCol = dayToCol(today, viewStart, chartWidth, totalDays)

  if (todayCol >= 0 && todayCol < chartWidth) {
    rulerChars[todayCol] = '▼'
  }

  // Windowed scrolling
  const maxVisibleRows = Math.max(1, height - 5)
  let start = 0
  if (roadmapItems.length > maxVisibleRows) {
    start = Math.max(
      0,
      Math.min(
        roadmapItems.length - maxVisibleRows,
        selectedIndex - Math.floor(maxVisibleRows / 2),
      ),
    )
  }
  const visible = roadmapItems.slice(start, start + maxVisibleRows)

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

      {roadmapItems.length === 0 && <Text dimColor>(no items)</Text>}
      {start > 0 && <Text dimColor>↑ {start} more</Text>}
      {visible.map((ri, i) => {
        const absIndex = start + i
        const selected = absIndex === selectedIndex
        const label = truncateByWidth(
          `${ri.item.content.number ? `#${ri.item.content.number} ` : ''}${ri.item.content.title}`,
          labelWidth,
        )
        const status = truncateByWidth(
          ri.item.singleSelectValues[columnFieldId]?.optionName ?? '',
          statusWidth,
        )

        // Build bar
        const barChars: string[] = Array.from({ length: chartWidth }, () => ' ')

        // Today line
        if (todayCol >= 0 && todayCol < chartWidth) {
          barChars[todayCol] = '│'
        }

        if (ri.range) {
          const barStart = Math.max(0, dayToCol(ri.range.start, viewStart, chartWidth, totalDays))
          const barEnd = Math.min(
            chartWidth - 1,
            dayToCol(ri.range.end, viewStart, chartWidth, totalDays),
          )
          for (let col = barStart; col <= barEnd; col++) {
            if (col === todayCol) {
              barChars[col] = '┃'
            } else {
              barChars[col] = '█'
            }
          }
        }

        const barColor = ri.range
          ? ri.item.content.state === 'CLOSED' || ri.item.content.state === 'MERGED'
            ? 'gray'
            : 'cyan'
          : undefined

        return (
          <Box key={ri.item.id}>
            <Text bold={selected} color={selected ? 'cyan' : undefined}>
              {padEnd(label, labelWidth)}
            </Text>
            <Text dimColor> │</Text>
            <Text color={selected ? 'white' : barColor} dimColor={!ri.range}>
              {barChars.join('')}
            </Text>
            <Text dimColor> {padEnd(status, statusWidth)}</Text>
          </Box>
        )
      })}
      {start + visible.length < roadmapItems.length && (
        <Text dimColor>↓ {roadmapItems.length - (start + visible.length)} more</Text>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          zoom: {zoom} ({totalDays}d) · ←/→ scroll · +/- zoom · t today · today:{' '}
          {fmtShortDate(today)}
        </Text>
      </Box>
    </Box>
  )
}
