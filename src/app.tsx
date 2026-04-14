import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useEffect, useMemo, useState } from 'react'
import { Board, groupItems } from './components/Board'
import { Help } from './components/Help'
import { StatusBar } from './components/StatusBar'
import { useProject } from './hooks/useProject'
import { openUrl } from './utils/open'

interface Props {
  host: string
  owner: string
  number: number
  columnField: string
  refreshIntervalSeconds?: number
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

  const columns = useMemo(() => (snapshot ? groupItems(snapshot) : []), [snapshot])

  useEffect(() => {
    if (columns.length === 0) return
    if (columnIndex >= columns.length) setColumnIndex(columns.length - 1)
    const col = columns[Math.min(columnIndex, columns.length - 1)]
    if (col && itemIndex >= col.items.length) {
      setItemIndex(Math.max(0, col.items.length - 1))
    }
  }, [columns, columnIndex, itemIndex])

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit()
      return
    }
    if (input === 'q') {
      exit()
      return
    }
    if (input === '?') {
      setShowHelp((v) => !v)
      return
    }
    if (showHelp) {
      if (key.escape || input === '?') setShowHelp(false)
      return
    }
    if (input === 'r') {
      reload()
      return
    }
    if (input === 'o') {
      const col = columns[columnIndex]
      const item = col?.items[itemIndex]
      if (item?.content.url) openUrl(item.content.url)
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
      const col = columns[columnIndex]
      const max = col ? Math.max(0, col.items.length - 1) : 0
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

  return (
    <Box flexDirection="column" width={size.width}>
      {showHelp ? (
        <Box flexDirection="column" padding={1}>
          <Help />
        </Box>
      ) : (
        <Board
          snapshot={snapshot}
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
      />
    </Box>
  )
}
