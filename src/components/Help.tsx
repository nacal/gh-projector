import { Box, Text } from 'ink'

const BINDINGS: [string, string][] = [
  ['←/h, →/l', 'previous/next column'],
  ['↑/k, ↓/j', 'previous/next item (scroll body in detail view)'],
  ['Enter, d', 'open detail view'],
  ['Esc', 'close detail / help'],
  ['o', 'open item in browser'],
  ['v', 'toggle board / tabs mode'],
  ['r', 'reload'],
  ['?', 'toggle help'],
  ['q / Ctrl+C', 'quit'],
]

export function Help() {
  return (
    <Box borderStyle="double" borderColor="cyan" flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>Keybindings</Text>
      <Box marginTop={1} flexDirection="column">
        {BINDINGS.map(([key, desc]) => (
          <Text key={key}>
            <Text color="cyan">{key.padEnd(14)}</Text>
            {desc}
          </Text>
        ))}
      </Box>
    </Box>
  )
}
