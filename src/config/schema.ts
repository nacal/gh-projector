import { z } from 'zod'

export const ConfigSchema = z.object({
  defaults: z
    .object({
      host: z.string().min(1).optional(),
      owner: z.string().min(1).optional(),
      number: z.number().int().positive().optional(),
      columnField: z.string().min(1).optional(),
    })
    .optional(),
  refreshIntervalSeconds: z.number().int().positive().optional(),
})

export type Config = z.infer<typeof ConfigSchema>

export const DEFAULT_HOST = 'github.com'
export const DEFAULT_COLUMN_FIELD = 'Status'
