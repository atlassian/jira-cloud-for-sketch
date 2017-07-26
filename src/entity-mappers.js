import { assign, pick, sortBy } from 'lodash'

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
  // we always display attachments by created date
  const attachments = attachment ? sortBy(attachment, 'created').reverse() : []
  return assign(
    pick(issue, 'key', 'self'),
    {
      key: issue.key,
      summary,
      type: issuetype ? pick(issuetype, typeProperties) : null,
      attachments
    }
  )
}

export function attachmentFromRest (attachment) {
  return pick(attachment, attachmentProperties)
}
