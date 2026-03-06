const LINEAR_API = 'https://api.linear.app/graphql'

async function query(apiKey, gql, variables = {}) {
  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify({ query: gql, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

export async function getLinearMe(apiKey) {
  const data = await query(apiKey, `{ viewer { id name email avatarUrl } }`)
  return data.viewer
}

export async function getLinearTasks(apiKey) {
  const data = await query(apiKey, `{
    viewer {
      assignedIssues(
        filter: { state: { type: { nin: ["canceled", "completed"] } } }
        orderBy: updatedAt
        first: 50
      ) {
        nodes {
          id
          identifier
          title
          priority
          state { id name type color }
          labels { nodes { id name color } }
          project { id name }
          url
          createdAt
          updatedAt
        }
      }
    }
  }`)
  return data.viewer.assignedIssues.nodes
}

export async function updateLinearTask(apiKey, taskId, updates) {
  // updates can include: { stateId, title, priority }
  const data = await query(apiKey, `
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue { id state { name type } }
      }
    }
  `, { id: taskId, input: updates })
  return data.issueUpdate
}
