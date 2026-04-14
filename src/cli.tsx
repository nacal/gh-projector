#!/usr/bin/env bun
import { render } from 'ink'
import meow from 'meow'
import { App } from './app'
import { loadConfig } from './config/load'
import { DEFAULT_COLUMN_FIELD, DEFAULT_HOST } from './config/schema'

const cli = meow(
  `
  Usage
    $ gh-projector [--host <host>] [--owner <owner>] [--number <n>] [--column-field <name>]

  Options
    --host          GitHub host (default: github.com)
    --owner         Organization or user login
    --number        Project number
    --column-field  SingleSelect field name used for columns (default: Status)

  Examples
    $ gh-projector --owner nacal --number 1
    $ gh-projector --host git.example.com --owner team --number 42
`,
  {
    importMeta: import.meta,
    flags: {
      host: { type: 'string' },
      owner: { type: 'string' },
      number: { type: 'number' },
      columnField: { type: 'string' },
    },
  },
)

async function main() {
  const config = await loadConfig()
  const d = config.defaults ?? {}

  const host = cli.flags.host ?? d.host ?? DEFAULT_HOST
  const owner = cli.flags.owner ?? d.owner
  const number = cli.flags.number ?? d.number
  const columnField = cli.flags.columnField ?? d.columnField ?? DEFAULT_COLUMN_FIELD

  if (!owner || !number) {
    console.error('Missing owner or number. Provide via --owner / --number, or set defaults in')
    console.error('  ~/.config/gh-projector/config.json')
    console.error('\nExample config:')
    console.error(
      JSON.stringify({ defaults: { host: 'github.com', owner: 'nacal', number: 1 } }, null, 2),
    )
    process.exit(2)
  }

  const { waitUntilExit } = render(
    <App
      host={host}
      owner={owner}
      number={number}
      columnField={columnField}
      refreshIntervalSeconds={config.refreshIntervalSeconds}
    />,
  )
  await waitUntilExit()
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
