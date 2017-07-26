import { assign, pick } from 'lodash'

const typeProperties = [
  'name',
  'iconUrl'
]
const attachmentProperties = [
  'id',
  'filename',
  'created',
  'size',
  'mimeType',
  'content',
  'thumbnail'
]

export function issueFromRest (issue) {
  const { issuetype, attachment, summary } = issue.fields
  return assign(
    pick(issue, 'key', 'self'),
    {
      key: issue.key,
      summary: summary,
      type: issuetype ? pick(issuetype, typeProperties) : null,
      attachments: (attachment || []).map(attachment => {
        return pick(attachment, attachmentProperties)
      })
    }
  )
}
