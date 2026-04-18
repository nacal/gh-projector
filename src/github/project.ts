import type {
  Assignee,
  BaseContent,
  ColumnDef,
  ContentKind,
  FieldValue,
  Item,
  Label,
  ProjectSnapshot,
  ProjectView,
  SingleSelectFieldDef,
  SortDirection,
  ViewLayout,
} from '../types'
import type { GraphQLClient } from './client'
import {
  ORG_PROJECT_QUERY,
  PROJECT_FIELDS_QUERY,
  PROJECT_ITEMS_QUERY,
  PROJECT_VIEWS_QUERY,
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
): Promise<{
  fieldId: string
  fieldName: string
  columns: ColumnDef[]
  fields: SingleSelectFieldDef[]
}> {
  const d = await client.query<{ node: { fields: { nodes: FieldNode[] } } }>(PROJECT_FIELDS_QUERY, {
    projectId,
  })
  const singleSelects: SingleSelectFieldDef[] = d.node.fields.nodes
    .filter((f) => f.__typename === 'ProjectV2SingleSelectField')
    .map((f) => ({
      id: f.id,
      name: f.name,
      options: (f.options ?? []).map((o) => ({ id: o.id, name: o.name })),
    }))
  const exact = singleSelects.find((f) => f.name === preferredName)
  const chosen = exact ?? singleSelects.find((f) => f.name === 'Status')
  if (!chosen) {
    throw new Error(
      `No SingleSelect field named "${preferredName}" (nor "Status") found in project`,
    )
  }
  return {
    fieldId: chosen.id,
    fieldName: chosen.name,
    columns: chosen.options,
    fields: singleSelects,
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
    body?: string
    createdAt?: string
    updatedAt?: string
    parentIssue?: { id: string; number: number; title: string } | null
    assignees?: { nodes: Assignee[] }
    labels?: { nodes: Label[] }
  } | null
  fieldValues: { nodes: RawFieldValue[] }
}

function normalizeItem(raw: RawItem): Item | null {
  if (!raw.content) return null
  const kind = raw.content.__typename
  const content: BaseContent = {
    kind,
    title: raw.content.title ?? '(untitled)',
    number: raw.content.number,
    url: raw.content.url,
    state: raw.content.state,
    body: raw.content.body,
    createdAt: raw.content.createdAt,
    updatedAt: raw.content.updatedAt,
    parentId: raw.content.parentIssue?.id,
    parentNumber: raw.content.parentIssue?.number,
    parentTitle: raw.content.parentIssue?.title,
    assignees: raw.content.assignees?.nodes ?? [],
    labels: raw.content.labels?.nodes ?? [],
  }

  const singleSelectValues: Record<string, { optionId: string; optionName: string }> = {}
  const extraFields: FieldValue[] = []

  for (const fv of raw.fieldValues.nodes) {
    const fieldName = fv.field?.name
    const fieldId = fv.field?.id
    if (!fieldName || !fieldId) continue
    if (fv.__typename === 'ProjectV2ItemFieldSingleSelectValue' && fv.optionId) {
      singleSelectValues[fieldId] = {
        optionId: fv.optionId,
        optionName: fv.name ?? '',
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
    singleSelectValues,
    extraFields,
  }
}

async function fetchAllItems(client: GraphQLClient, projectId: string): Promise<Item[]> {
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
      const item = normalizeItem(raw)
      if (item) items.push(item)
    }
    if (!d.node.items.pageInfo.hasNextPage) break
    cursor = d.node.items.pageInfo.endCursor
  }
  return items
}

interface RawView {
  id: string
  name: string
  number: number
  layout: ViewLayout
  filter: string | null
  groupByFields: { nodes: Array<{ id: string; name: string }> }
  sortByFields: {
    nodes: Array<{
      field: { id: string; name: string }
      direction: SortDirection
    }>
  }
}

async function fetchViews(client: GraphQLClient, projectId: string): Promise<ProjectView[]> {
  try {
    const d = await client.query<{ node: { views: { nodes: RawView[] } } }>(PROJECT_VIEWS_QUERY, {
      projectId,
    })
    return d.node.views.nodes.map((v) => ({
      id: v.id,
      name: v.name,
      number: v.number,
      layout: v.layout,
      filter: v.filter && v.filter.length > 0 ? v.filter : null,
      groupByFieldId: v.groupByFields.nodes[0]?.id ?? null,
      groupByFieldName: v.groupByFields.nodes[0]?.name ?? null,
      sortBy: v.sortByFields.nodes.map((s) => ({
        fieldId: s.field.id,
        fieldName: s.field.name,
        direction: s.direction,
      })),
    }))
  } catch {
    return []
  }
}

export async function fetchProject(
  client: GraphQLClient,
  owner: string,
  number: number,
  columnFieldName: string,
): Promise<ProjectSnapshot> {
  const ref = await resolveProjectRef(client, owner, number)
  const { fieldId, fieldName, columns, fields } = await resolveColumnField(
    client,
    ref.id,
    columnFieldName,
  )
  const [items, views] = await Promise.all([
    fetchAllItems(client, ref.id),
    fetchViews(client, ref.id),
  ])
  return {
    projectId: ref.id,
    projectTitle: ref.title,
    projectUrl: ref.url,
    columnFieldId: fieldId,
    columnFieldName: fieldName,
    columns,
    fields,
    items,
    views,
    fetchedAt: new Date(),
  }
}
