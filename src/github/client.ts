import { getToken } from './auth'

export interface GraphQLClient {
  query<T>(query: string, variables?: Record<string, unknown>): Promise<T>
}

export function graphqlEndpoint(host: string): string {
  return host === 'github.com' ? 'https://api.github.com/graphql' : `https://${host}/api/graphql`
}

export async function createClient(host: string): Promise<GraphQLClient> {
  const token = await getToken(host)
  const endpoint = graphqlEndpoint(host)

  return {
    async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'gh-projector',
        },
        body: JSON.stringify({ query, variables }),
      })
      if (!res.ok) {
        throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`)
      }
      const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }
      if (json.errors && json.errors.length > 0) {
        throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`)
      }
      if (!json.data) throw new Error('GraphQL response missing data')
      return json.data
    },
  }
}
