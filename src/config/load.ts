import { homedir } from 'node:os'
import { join } from 'node:path'
import { type Config, ConfigSchema } from './schema'

export function configPath(): string {
  const xdg = process.env.XDG_CONFIG_HOME
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), '.config')
  return join(base, 'gh-projector', 'config.json')
}

export async function loadConfig(): Promise<Config> {
  const path = configPath()
  const file = Bun.file(path)
  if (!(await file.exists())) return {}
  let raw: unknown
  try {
    raw = await file.json()
  } catch (e) {
    throw new Error(`Invalid JSON in ${path}: ${(e as Error).message}`)
  }
  const parsed = ConfigSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Invalid config at ${path}: ${parsed.error.message}`)
  }
  return parsed.data
}
