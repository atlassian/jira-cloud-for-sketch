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
  const { issuetype, attachment, summary, assignee, reporter } = issue.fields
  // we always display attachments by created date
  const attachments = attachment ? sortBy(attachment, 'created').reverse() : []
  return assign(
    pick(issue, 'key', 'self'),
    {
      summary,
      type: issuetype ? pick(issuetype, typeProperties) : null,
      attachments,
      assignee,
      reporter
    }
  )
}

export function attachmentFromRest (attachment) {
  return pick(attachment, attachmentProperties)
}
