export const ORG_PROJECT_QUERY = /* GraphQL */ `
  query OrgProject($owner: String!, $number: Int!) {
    organization(login: $owner) {
      projectV2(number: $number) {
        id
        title
        url
      }
    }
  }
`

export const USER_PROJECT_QUERY = /* GraphQL */ `
  query UserProject($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        id
        title
        url
      }
    }
  }
`

export const PROJECT_FIELDS_QUERY = /* GraphQL */ `
  query ProjectFields($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: 50) {
          nodes {
            __typename
            ... on ProjectV2FieldCommon {
              id
              name
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`

export const PROJECT_ITEMS_QUERY = /* GraphQL */ `
  query ProjectItems($projectId: ID!, $cursor: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        items(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            isArchived
            content {
              __typename
              ... on DraftIssue {
                title
                body
                assignees(first: 10) {
                  nodes {
                    login
                  }
                }
              }
              ... on Issue {
                title
                number
                url
                state
                body
                assignees(first: 10) {
                  nodes {
                    login
                  }
                }
                labels(first: 10) {
                  nodes {
                    name
                    color
                  }
                }
              }
              ... on PullRequest {
                title
                number
                url
                state
                body
                assignees(first: 10) {
                  nodes {
                    login
                  }
                }
                labels(first: 10) {
                  nodes {
                    name
                    color
                  }
                }
              }
            }
            fieldValues(first: 30) {
              nodes {
                __typename
                ... on ProjectV2ItemFieldSingleSelectValue {
                  optionId
                  name
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                }
                ... on ProjectV2ItemFieldIterationValue {
                  title
                  field {
                    ... on ProjectV2FieldCommon {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export const UPDATE_ITEM_FIELD_VALUE_MUTATION = /* GraphQL */ `
  mutation UpdateItemFieldValue($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(
      input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: { singleSelectOptionId: $optionId }
      }
    ) {
      projectV2Item {
        id
      }
    }
  }
`

export const ADD_DRAFT_ISSUE_MUTATION = /* GraphQL */ `
  mutation AddDraftIssue($projectId: ID!, $title: String!, $body: String) {
    addProjectV2DraftIssue(input: { projectId: $projectId, title: $title, body: $body }) {
      projectItem {
        id
      }
    }
  }
`

export const ARCHIVE_ITEM_MUTATION = /* GraphQL */ `
  mutation ArchiveItem($projectId: ID!, $itemId: ID!) {
    archiveProjectV2Item(input: { projectId: $projectId, itemId: $itemId }) {
      item {
        id
      }
    }
  }
`
