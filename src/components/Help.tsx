import { Box, Text } from 'ink'

const BINDINGS: [string, string][] = [
  ['←/h', 'previous column'],
  ['→/l', 'next column'],
  ['↑/k', 'previous item'],
  ['↓/j', 'next item'],
  ['o', 'open item in browser'],
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
            <Text color="cyan">{key.padEnd(12)}</Text>
            {desc}
          </Text>
        ))}
      </Box>
    </Box>
  )
}
