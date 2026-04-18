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
  body?: string
  createdAt?: string
  updatedAt?: string
  parentId?: string
  parentNumber?: number
  parentTitle?: string
  assignees: Assignee[]
  labels: Label[]
}

export interface FieldValue {
  fieldName: string
  text: string
}

export interface SingleSelectValue {
  optionId: string
  optionName: string
}

export interface Item {
  id: string
  content: BaseContent
  /** Mapping from SingleSelect field ID to the item's selected option. */
  singleSelectValues: Record<string, SingleSelectValue>
  /** Non-SingleSelect custom field values (text/number/date/iteration). */
  extraFields: FieldValue[]
}

export interface ColumnDef {
  id: string
  name: string
}

export interface SingleSelectFieldDef {
  id: string
  name: string
  options: ColumnDef[]
}

export type ViewLayout = 'BOARD_LAYOUT' | 'TABLE_LAYOUT' | 'ROADMAP_LAYOUT'

export type SortDirection = 'ASC' | 'DESC'

export interface ViewSortBy {
  fieldId: string
  fieldName: string
  direction: SortDirection
}

export interface ProjectView {
  id: string
  name: string
  number: number
  layout: ViewLayout
  filter: string | null
  groupByFieldId: string | null
  groupByFieldName: string | null
  sortBy: ViewSortBy[]
}

export interface ProjectSnapshot {
  projectId: string
  projectTitle: string
  projectUrl: string
  columnFieldId: string
  columnFieldName: string
  columns: ColumnDef[]
  fields: SingleSelectFieldDef[]
  items: Item[]
  views: ProjectView[]
  fetchedAt: Date
}
