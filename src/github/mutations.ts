import type { GraphQLClient } from './client'
import {
  ADD_DRAFT_ISSUE_MUTATION,
  ARCHIVE_ITEM_MUTATION,
  UPDATE_ITEM_FIELD_VALUE_MUTATION,
} from './queries'

export async function updateItemStatus(
  client: GraphQLClient,
  projectId: string,
  itemId: string,
  fieldId: string,
  optionId: string,
): Promise<void> {
  await client.query(UPDATE_ITEM_FIELD_VALUE_MUTATION, {
    projectId,
    itemId,
    fieldId,
    optionId,
  })
}

export async function addDraftIssue(
  client: GraphQLClient,
  projectId: string,
  title: string,
  body?: string,
): Promise<string> {
  const d = await client.query<{
    addProjectV2DraftIssue: { projectItem: { id: string } }
  }>(ADD_DRAFT_ISSUE_MUTATION, { projectId, title, body: body ?? null })
  return d.addProjectV2DraftIssue.projectItem.id
}

export async function archiveItem(
  client: GraphQLClient,
  projectId: string,
  itemId: string,
): Promise<void> {
  await client.query(ARCHIVE_ITEM_MUTATION, { projectId, itemId })
}
