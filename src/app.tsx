import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Board, groupItems } from './components/Board'
import { DetailView } from './components/DetailView'
import { Help } from './components/Help'
import { StatusBar } from './components/StatusBar'
import { TabsView } from './components/TabsView'
import { useProject } from './hooks/useProject'
import { openUrl } from './utils/open'

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

  const { snapshot, loading, error, reload } = useProject(props)
  const [columnIndex, setColumnIndex] = useState(0)
  const [itemIndex, setItemIndex] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [bodyScroll, setBodyScroll] = useState(0)
  const [modeOverride, setModeOverride] = useState<ViewMode | null>(null)
  const userToggled = useRef(false)

  const columns = useMemo(() => (snapshot ? groupItems(snapshot) : []), [snapshot])
  const columnCount = columns.length
  const autoMode = autoViewMode(size.width, Math.max(1, columnCount))
  const viewMode: ViewMode = modeOverride ?? autoMode

  useEffect(() => {
    if (columns.length === 0) return
    if (columnIndex >= columns.length) setColumnIndex(columns.length - 1)
    const col = columns[Math.min(columnIndex, columns.length - 1)]
    if (col && itemIndex >= col.items.length) {
      setItemIndex(Math.max(0, col.items.length - 1))
    }
  }, [columns, columnIndex, itemIndex])

  const currentCol = columns[columnIndex]
  const currentItem = currentCol?.items[itemIndex]

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit()
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
        <Text color="gray">Press q to exit, r to retry.</Text>
      </Box>
    )
  }

  if (!snapshot) return null

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
          snapshot={snapshot}
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
      <StatusBar
        projectTitle={snapshot.projectTitle}
        owner={props.owner}
        number={props.number}
        host={props.host}
        itemCount={snapshot.items.length}
        fetchedAt={snapshot.fetchedAt}
        loading={loading}
        error={error}
        mode={hint}
        detailOpen={showDetail}
      />
    </Box>
  )
}
