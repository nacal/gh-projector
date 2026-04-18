import { Box, Text } from 'ink'
import type { Item } from '../types'

export type ZoomLevel = 'day' | 'week' | 'month'

interface Props {
  items: Item[]
  selectedIndex: number
  width: number
  height: number
  zoom: ZoomLevel
  /** Scroll offset in zoom units from the left edge of the time range. */
  scrollOffset: number
  /** Column field ID for status display. */
  columnFieldId: string
}

interface DateRange {
  start: Date
  end: Date
}

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
    dates.length >= 2
      ? new Date(dates[dates.length - 1]!)
      : new Date(start.getTime() + 7 * 86400000)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return { start, end: end >= start ? end : start }
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function fmtMonth(d: Date): string {
  const months = [
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
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

function zoomDays(zoom: ZoomLevel): number {
  switch (zoom) {
    case 'day':
      return 1
    case 'week':
      return 7
    case 'month':
      return 30
  }
}

function truncate(s: string, max: number): string {
  if (max <= 0) return ''
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

function pad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + ' '.repeat(width - s.length)
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
  const labelWidth = Math.min(30, Math.max(15, Math.floor(width * 0.2)))
  const chartWidth = width - labelWidth - 3

  const roadmapItems: RoadmapItem[] = items.map((item) => ({
    item,
    range: parseDateFields(item),
  }))

  // Determine time range from all items with dates
  const allDates = roadmapItems
    .filter((r) => r.range)
    .flatMap((r) => [r.range!.start.getTime(), r.range!.end.getTime()])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (allDates.length === 0) allDates.push(today.getTime())

  const globalStart = new Date(Math.min(...allDates, today.getTime()))
  globalStart.setHours(0, 0, 0, 0)

  const daysPerCell = zoomDays(zoom)
  const viewStartDay = scrollOffset * daysPerCell
  const viewStart = new Date(globalStart.getTime() + viewStartDay * 86400000)

  // Header: date labels across the chart area
  const headerLabels: string[] = []
  for (let col = 0; col < chartWidth; col++) {
    const d = new Date(viewStart.getTime() + col * daysPerCell * 86400000)
    if (zoom === 'day' && col % 7 === 0) {
      headerLabels.push(fmtDate(d))
    } else if (zoom === 'week' && col % 4 === 0) {
      headerLabels.push(fmtDate(d))
    } else if (zoom === 'month' && col % 3 === 0) {
      headerLabels.push(fmtMonth(d))
    }
  }

  // Build header string
  let headerStr = ''
  for (let col = 0; col < chartWidth; col++) {
    const d = new Date(viewStart.getTime() + col * daysPerCell * 86400000)
    let label = ''
    if (zoom === 'day' && col % 7 === 0) label = fmtDate(d)
    else if (zoom === 'week' && col % 4 === 0) label = fmtDate(d)
    else if (zoom === 'month' && col % 3 === 0) label = fmtMonth(d)

    if (label) {
      headerStr += label
      col += label.length - 1
    } else {
      headerStr += ' '
    }
  }

  // Today marker column
  const todayCol = Math.floor(daysBetween(viewStart, today) / daysPerCell)

  // Windowed scrolling
  const maxVisibleRows = Math.max(1, height - 4)
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
      {/* Header */}
      <Box>
        <Text dimColor>{pad('', labelWidth)} </Text>
        <Text dimColor>{truncate(headerStr, chartWidth)}</Text>
      </Box>
      <Box>
        <Text dimColor>{pad('', labelWidth)} </Text>
        <Text dimColor>
          {Array.from({ length: chartWidth }, (_, i) => (i === todayCol ? '▼' : '─')).join('')}
        </Text>
      </Box>

      {/* Rows */}
      {roadmapItems.length === 0 && <Text dimColor>(no items)</Text>}
      {start > 0 && <Text dimColor>↑ {start} more</Text>}
      {visible.map((ri, i) => {
        const absIndex = start + i
        const selected = absIndex === selectedIndex
        const label = truncate(
          `${ri.item.content.number ? `#${ri.item.content.number} ` : ''}${ri.item.content.title}`,
          labelWidth,
        )
        const status = ri.item.singleSelectValues[columnFieldId]?.optionName ?? ''

        // Build bar
        let bar = ''
        if (ri.range) {
          const barStart = Math.floor(daysBetween(viewStart, ri.range.start) / daysPerCell)
          const barEnd = Math.floor(daysBetween(viewStart, ri.range.end) / daysPerCell)
          for (let col = 0; col < chartWidth; col++) {
            if (col === todayCol) {
              bar += col >= barStart && col <= barEnd ? '┃' : '│'
            } else if (col >= barStart && col <= barEnd) {
              bar += '█'
            } else {
              bar += ' '
            }
          }
        } else {
          // No date range
          for (let col = 0; col < chartWidth; col++) {
            bar += col === todayCol ? '│' : ' '
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
              {pad(label, labelWidth)}
            </Text>
            <Text dimColor> </Text>
            <Text color={selected ? 'white' : barColor} dimColor={!ri.range}>
              {bar}
            </Text>
            {status && <Text dimColor> {truncate(status, 12)}</Text>}
          </Box>
        )
      })}
      {start + visible.length < roadmapItems.length && (
        <Text dimColor>↓ {roadmapItems.length - (start + visible.length)} more</Text>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          zoom: {zoom} · today: {fmtDate(today)} · +/- zoom · ←/→ scroll · t today
        </Text>
      </Box>
    </Box>
  )
}
