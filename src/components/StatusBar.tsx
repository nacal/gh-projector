import { Box, Text } from 'ink'

interface Props {
  projectTitle: string
  owner: string
  number: number
  host: string
  itemCount: number
  fetchedAt: Date | null
  loading: boolean
  error: string | null
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
  fetchedAt,
  loading,
  error,
}: Props) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text bold>{projectTitle}</Text>
        <Text color="gray">
          {' '}
          ({host}/{owner}#{number}) · {itemCount} items
          {fetchedAt && ` · updated ${fmtTime(fetchedAt)}`}
          {loading && ' · loading…'}
        </Text>
      </Box>
      {error && <Text color="red">error: {error}</Text>}
      <Text color="gray">←/→ column · ↑/↓ item · o open · r reload · ? help · q quit</Text>
    </Box>
  )
}
