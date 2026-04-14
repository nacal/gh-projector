export type ContentKind = 'Issue' | 'PullRequest' | 'DraftIssue'

export interface Assignee {
  login: string
}

export interface Label {
  name: string
  color: string
}

export interface BaseContent {
  kind: ContentKind
  title: string
  number?: number
  url?: string
  state?: string
  assignees: Assignee[]
  labels: Label[]
}

export interface FieldValue {
  fieldName: string
  text: string
}

export interface Item {
  id: string
  content: BaseContent
  statusOptionId: string | null
  statusName: string | null
  extraFields: FieldValue[]
}

export interface ColumnDef {
  id: string
  name: string
}

export interface ProjectSnapshot {
  projectId: string
  projectTitle: string
  projectUrl: string
  columnFieldId: string
  columnFieldName: string
  columns: ColumnDef[]
  items: Item[]
  fetchedAt: Date
}
