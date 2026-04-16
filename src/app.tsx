import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board, NO_STATUS_ID, groupItems } from './components/Board'
import { DetailView } from './components/DetailView'
import { Help } from './components/Help'
import { StatusBar } from './components/StatusBar'
import { TabsView } from './components/TabsView'
import { useProject } from './hooks/useProject'
import { copyToClipboard } from './utils/clipboard'
import { applyFilter } from './utils/filter'
import { openUrl } from './utils/open'
import { SORT_KEYS, type SortKey, sortItems, sortLabel } from './utils/sort'

interface Props {
  host: string
  owner: string
  number: number
  columnField: string
  refreshIntervalSeconds?: number
}

type ViewMode = 'board' | 'tabs'

const MIN_COLUMN_WIDTH_FOR_BOARD = 28

function autoViewMode(width: number, columnCount: number): ViewMode {
  if (columnCount <= 1) return 'tabs'
  return columnCount * MIN_COLUMN_WIDTH_FOR_BOARD <= width ? 'board' : 'tabs'
}

export function App(props: Props) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const [size, setSize] = useState({
    width: stdout.columns || 120,
    height: stdout.rows || 40,
  })

  useEffect(() => {
    const onResize = () => setSize({ width: stdout.columns, height: stdout.rows })
    stdout.on('resize', onResize)
    return () => {
      stdout.off('resize', onResize)
    }
  }, [stdout])

  const { snapshot, loading, error, reload, moveItem, createDraft, archiveItem } = useProject(props)
  const [columnIndex, setColumnIndex] = useState(0)
  const [itemIndex, setItemIndex] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [bodyScroll, setBodyScroll] = useState(0)
  const [modeOverride, setModeOverride] = useState<ViewMode | null>(null)
  const [filter, setFilter] = useState('')
  const [filterDraft, setFilterDraft] = useState<string | null>(null)
  const [draftInput, setDraftInput] = useState<string | null>(null)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('manual')
  const userToggled = useRef(false)

  const filteredSnapshot = useMemo(
    () => (snapshot ? applyFilter(snapshot, filter) : null),
    [snapshot, filter],
  )
  const columns = useMemo(() => {
    if (!filteredSnapshot) return []
    const cols = groupItems(filteredSnapshot)
    if (sortKey === 'manual') return cols
    return cols.map((c) => ({ ...c, items: sortItems(c.items, sortKey) }))
  }, [filteredSnapshot, sortKey])
  const columnCount = columns.length
  const autoMode = autoViewMode(size.width, Math.max(1, columnCount))
  const viewMode: ViewMode = modeOverride ?? autoMode

  useEffect(() => {
    if (columns.length === 0) {
      setColumnIndex(0)
      setItemIndex(0)
      return
    }
    if (columnIndex >= columns.length) setColumnIndex(columns.length - 1)
    const col = columns[Math.min(columnIndex, columns.length - 1)]
    if (col && itemIndex >= col.items.length) {
      setItemIndex(Math.max(0, col.items.length - 1))
    }
  }, [columns, columnIndex, itemIndex])

  const currentCol = columns[columnIndex]
  const currentItem = currentCol?.items[itemIndex]

  const showFlash = useCallback((msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 1500)
  }, [])

  // find original (unfiltered) column list for status moves
  const allColumns = useMemo(() => (snapshot ? groupItems(snapshot) : []), [snapshot])

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit()
      return
    }

    // draft issue input mode
    if (draftInput !== null) {
      if (key.escape) {
        setDraftInput(null)
        return
      }
      if (key.return) {
        const title = draftInput.trim()
        if (title) {
          createDraft(title)
          showFlash(`Created draft: ${title}`)
        }
        setDraftInput(null)
        return
      }
      if (key.backspace || key.delete) {
        setDraftInput((d) => (d ?? '').slice(0, -1))
        return
      }
      if (input && !key.ctrl && !key.meta) {
        setDraftInput((d) => (d ?? '') + input)
        return
      }
      return
    }

    // archive confirmation
    if (confirmArchive) {
      if (input === 'y' || input === 'Y') {
        if (currentItem) {
          archiveItem(currentItem.id)
          showFlash('Archived')
        }
      }
      setConfirmArchive(false)
      return
    }

    // filter input mode
    if (filterDraft !== null) {
      if (key.escape) {
        setFilterDraft(null)
        return
      }
      if (key.return) {
        setFilter(filterDraft)
        setFilterDraft(null)
        return
      }
      if (key.backspace || key.delete) {
        setFilterDraft((d) => (d ?? '').slice(0, -1))
        return
      }
      if (input && !key.ctrl && !key.meta) {
        setFilterDraft((d) => (d ?? '') + input)
        return
      }
      return
    }

    if (input === 'q') {
      if (showDetail) {
        setShowDetail(false)
        return
      }
      exit()
      return
    }

    if (showHelp) {
      if (key.escape || input === '?' || input === 'q') setShowHelp(false)
      return
    }
    if (input === '?') {
      setShowHelp(true)
      return
    }

    if (showDetail) {
      if (key.escape) {
        setShowDetail(false)
        return
      }
      if (key.upArrow || input === 'k') {
        setBodyScroll((s) => Math.max(0, s - 1))
        return
      }
      if (key.downArrow || input === 'j') {
        setBodyScroll((s) => s + 1)
        return
      }
      if (input === 'o' && currentItem?.content.url) {
        openUrl(currentItem.content.url)
        return
      }
      if (input === 'y' && currentItem?.content.url) {
        copyToClipboard(currentItem.content.url)
        showFlash('URL copied')
        return
      }
      return
    }

    if (key.escape && filter.length > 0) {
      setFilter('')
      return
    }
    if (input === '/') {
      setFilterDraft(filter)
      return
    }
    if (input === 'r') {
      reload()
      return
    }
    if (input === 'v') {
      userToggled.current = true
      setModeOverride(viewMode === 'board' ? 'tabs' : 'board')
      return
    }
    if (input === 'o') {
      if (currentItem?.content.url) openUrl(currentItem.content.url)
      return
    }
    if (input === 'y') {
      if (currentItem?.content.url) {
        copyToClipboard(currentItem.content.url)
        showFlash('URL copied')
      }
      return
    }
    if (input === 's') {
      const idx = SORT_KEYS.indexOf(sortKey)
      const next = SORT_KEYS[(idx + 1) % SORT_KEYS.length]!
      setSortKey(next)
      showFlash(`sort: ${sortLabel(next)}`)
      return
    }
    if (input === 'n') {
      setDraftInput('')
      return
    }
    if (input === 'x') {
      if (currentItem) setConfirmArchive(true)
      return
    }

    // status move: > shifts right, < shifts left in the FULL column list
    if (input === '>' || input === '<') {
      if (!currentItem || !snapshot) return
      const curOptId = currentItem.statusOptionId ?? NO_STATUS_ID
      const allColIdx = allColumns.findIndex((c) => c.id === curOptId)
      if (allColIdx === -1) return
      const dir = input === '>' ? 1 : -1
      const targetIdx = allColIdx + dir
      const target = allColumns[targetIdx]
      if (!target || target.id === NO_STATUS_ID) return
      moveItem(currentItem.id, target.id)
      showFlash(`→ ${target.name}`)
      return
    }

    if (key.return || input === 'd') {
      if (currentItem) {
        setBodyScroll(0)
        setShowDetail(true)
      }
      return
    }
    if (key.leftArrow || input === 'h') {
      setColumnIndex((i) => Math.max(0, i - 1))
      setItemIndex(0)
      return
    }
    if (key.rightArrow || input === 'l') {
      setColumnIndex((i) => Math.min(Math.max(0, columns.length - 1), i + 1))
      setItemIndex(0)
      return
    }
    if (key.upArrow || input === 'k') {
      setItemIndex((i) => Math.max(0, i - 1))
      return
    }
    if (key.downArrow || input === 'j') {
      const max = currentCol ? Math.max(0, currentCol.items.length - 1) : 0
      setItemIndex((i) => Math.min(max, i + 1))
      return
    }
  })

  const boardHeight = Math.max(5, size.height - 4)

  if (!snapshot && loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>Loading project…</Text>
      </Box>
    )
  }

  if (!snapshot && error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press q to exit, r to retry.</Text>
      </Box>
    )
  }

  if (!snapshot || !filteredSnapshot) return null

  const hint = viewMode === 'board' ? 'board' : `tabs${modeOverride ? '' : ' (auto)'}`

  return (
    <Box flexDirection="column" width={size.width}>
      {showHelp ? (
        <Box flexDirection="column" padding={1}>
          <Help />
        </Box>
      ) : showDetail && currentItem ? (
        <DetailView
          item={currentItem}
          columnName={currentCol?.name ?? null}
          width={size.width}
          height={boardHeight}
          scrollOffset={bodyScroll}
        />
      ) : viewMode === 'board' ? (
        <Board
          snapshot={filteredSnapshot}
          columnIndex={columnIndex}
          itemIndex={itemIndex}
          width={size.width}
          height={boardHeight}
        />
      ) : (
        <TabsView
          columns={columns}
          columnIndex={columnIndex}
          itemIndex={itemIndex}
          width={size.width}
          height={boardHeight}
        />
      )}
      {draftInput !== null && (
        <Box marginTop={1}>
          <Text color="yellow">new draft: </Text>
          <Text>{draftInput}</Text>
          <Text dimColor>▌ (Enter to create, Esc to cancel)</Text>
        </Box>
      )}
      {confirmArchive && (
        <Box marginTop={1}>
          <Text color="red">Archive "{currentItem?.content.title}"? (y/N)</Text>
        </Box>
      )}
      {flash && (
        <Box marginTop={1}>
          <Text color="green">{flash}</Text>
        </Box>
      )}
      <StatusBar
        projectTitle={snapshot.projectTitle}
        owner={props.owner}
        number={props.number}
        host={props.host}
        itemCount={filteredSnapshot.items.length}
        totalCount={snapshot.items.length}
        fetchedAt={snapshot.fetchedAt}
        loading={loading}
        error={error}
        mode={hint}
        sort={sortKey}
        detailOpen={showDetail}
        filter={filter}
        filterInput={filterDraft}
      />
    </Box>
  )
}
