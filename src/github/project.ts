import type {
  Assignee,
  BaseContent,
  ColumnDef,
  ContentKind,
  FieldValue,
  Item,
  Label,
  ProjectSnapshot,
} from '../types'
import type { GraphQLClient } from './client'
import {
  ORG_PROJECT_QUERY,
  PROJECT_FIELDS_QUERY,
  PROJECT_ITEMS_QUERY,
  USER_PROJECT_QUERY,
} from './queries'

interface ProjectRef {
  id: string
  title: string
  url: string
}

async function resolveProjectRef(
  client: GraphQLClient,
  owner: string,
  number: number,
): Promise<ProjectRef> {
  try {
    const d = await client.query<{ organization: { projectV2: ProjectRef | null } | null }>(
      ORG_PROJECT_QUERY,
      { owner, number },
    )
    const p = d.organization?.projectV2
    if (p) return p
  } catch {
    // fall through to user lookup
  }
  const d = await client.query<{ user: { projectV2: ProjectRef | null } | null }>(
    USER_PROJECT_QUERY,
    { owner, number },
  )
  const p = d.user?.projectV2
  if (!p) {
    throw new Error(`Project not found: ${owner}/#${number}`)
  }
  return p
}

interface FieldNode {
  __typename: string
  id: string
  name: string
  options?: Array<{ id: string; name: string }>
}

async function resolveColumnField(
  client: GraphQLClient,
  projectId: string,
  preferredName: string,
): Promise<{ fieldId: string; fieldName: string; columns: ColumnDef[] }> {
  const d = await client.query<{ node: { fields: { nodes: FieldNode[] } } }>(PROJECT_FIELDS_QUERY, {
    projectId,
  })
  const singleSelects = d.node.fields.nodes.filter(
    (f) => f.__typename === 'ProjectV2SingleSelectField',
  )
  const exact = singleSelects.find((f) => f.name === preferredName)
  const chosen = exact ?? singleSelects.find((f) => f.name === 'Status')
  if (!chosen) {
    throw new Error(
      `No SingleSelect field named "${preferredName}" (nor "Status") found in project`,
    )
  }
  const options = chosen.options ?? []
  return {
    fieldId: chosen.id,
    fieldName: chosen.name,
    columns: options.map((o) => ({ id: o.id, name: o.name })),
  }
}

interface RawFieldValue {
  __typename: string
  optionId?: string
  name?: string
  text?: string
  number?: number
  date?: string
  title?: string
  field?: { id: string; name: string }
}

interface RawItem {
  id: string
  isArchived: boolean
  content: {
    __typename: ContentKind
    title?: string
    number?: number
    url?: string
    state?: string
    assignees?: { nodes: Assignee[] }
    labels?: { nodes: Label[] }
  } | null
  fieldValues: { nodes: RawFieldValue[] }
}

function normalizeItem(raw: RawItem, columnFieldId: string): Item | null {
  if (!raw.content) return null
  const kind = raw.content.__typename
  const content: BaseContent = {
    kind,
    title: raw.content.title ?? '(untitled)',
    number: raw.content.number,
    url: raw.content.url,
    state: raw.content.state,
    assignees: raw.content.assignees?.nodes ?? [],
    labels: raw.content.labels?.nodes ?? [],
  }

  let statusOptionId: string | null = null
  let statusName: string | null = null
  const extraFields: FieldValue[] = []

  for (const fv of raw.fieldValues.nodes) {
    const fieldName = fv.field?.name
    if (!fieldName) continue
    if (fv.__typename === 'ProjectV2ItemFieldSingleSelectValue') {
      if (fv.field?.id === columnFieldId) {
        statusOptionId = fv.optionId ?? null
        statusName = fv.name ?? null
      } else if (fv.name) {
        extraFields.push({ fieldName, text: fv.name })
      }
    } else if (fv.__typename === 'ProjectV2ItemFieldTextValue' && fv.text) {
      if (['Title', 'Labels', 'Assignees'].includes(fieldName)) continue
      extraFields.push({ fieldName, text: fv.text })
    } else if (fv.__typename === 'ProjectV2ItemFieldNumberValue' && fv.number !== undefined) {
      extraFields.push({ fieldName, text: String(fv.number) })
    } else if (fv.__typename === 'ProjectV2ItemFieldDateValue' && fv.date) {
      extraFields.push({ fieldName, text: fv.date })
    } else if (fv.__typename === 'ProjectV2ItemFieldIterationValue' && fv.title) {
      extraFields.push({ fieldName, text: fv.title })
    }
  }

  return {
    id: raw.id,
    content,
    statusOptionId,
    statusName,
    extraFields,
  }
}

async function fetchAllItems(
  client: GraphQLClient,
  projectId: string,
  columnFieldId: string,
): Promise<Item[]> {
  const items: Item[] = []
  let cursor: string | null = null
  for (;;) {
    const d: {
      node: {
        items: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
          nodes: RawItem[]
        }
      }
    } = await client.query(PROJECT_ITEMS_QUERY, { projectId, cursor })
    for (const raw of d.node.items.nodes) {
      if (raw.isArchived) continue
      const item = normalizeItem(raw, columnFieldId)
      if (item) items.push(item)
    }
    if (!d.node.items.pageInfo.hasNextPage) break
    cursor = d.node.items.pageInfo.endCursor
  }
  return items
}

export async function fetchProject(
  client: GraphQLClient,
  owner: string,
  number: number,
  columnFieldName: string,
): Promise<ProjectSnapshot> {
  const ref = await resolveProjectRef(client, owner, number)
  const { fieldId, fieldName, columns } = await resolveColumnField(client, ref.id, columnFieldName)
  const items = await fetchAllItems(client, ref.id, fieldId)
  return {
    projectId: ref.id,
    projectTitle: ref.title,
    projectUrl: ref.url,
    columnFieldId: fieldId,
    columnFieldName: fieldName,
    columns,
    items,
    fetchedAt: new Date(),
  }
}
