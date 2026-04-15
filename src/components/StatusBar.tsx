import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'

interface Props {
  projectTitle: string
  owner: string
  number: number
  host: string
  itemCount: number
  totalCount: number
  fetchedAt: Date | null
  loading: boolean
  error: string | null
  mode: string
  detailOpen: boolean
  filter: string
  filterInput: string | null
}

function fmtTime(d: Date): string {
  return d.toTimeString().slice(0, 8)
}

export function StatusBar({
  projectTitle,
  owner,
  number,
  host,
  itemCount,
  totalCount,
  fetchedAt,
  loading,
  error,
  mode,
  detailOpen,
  filter,
  filterInput,
}: Props) {
  const filtered = filter.length > 0 && itemCount !== totalCount
  const hint = detailOpen
    ? '↑/↓ scroll · o open · Esc back · q quit'
    : '←/→ column · ↑/↓ item · Enter detail · / filter · o open · v mode · r reload · ? help · q quit'

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text bold>{projectTitle}</Text>
        <Text color="gray">
          {' '}
          ({host}/{owner}#{number}) · {filtered ? `${itemCount}/${totalCount}` : totalCount} items ·{' '}
          {mode}
          {fetchedAt && ` · updated ${fmtTime(fetchedAt)}`}
        </Text>
        {loading && (
          <Text color="cyan">
            {'  '}
            <Spinner type="dots" /> refreshing
          </Text>
        )}
      </Box>
      {filterInput !== null ? (
        <Text>
          <Text color="yellow">/ </Text>
          <Text>{filterInput}</Text>
          <Text color="gray">▌ </Text>
          <Text color="gray">(Enter to apply, Esc to cancel)</Text>
        </Text>
      ) : filter.length > 0 ? (
        <Text color="yellow">
          filter: {filter} <Text color="gray">(Esc to clear)</Text>
        </Text>
      ) : null}
      {error && <Text color="red">error: {error}</Text>}
      <Text color="gray">{hint}</Text>
    </Box>
  )
}
