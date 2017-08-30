/*
 * Functions for mapping REST entities returned from the JIRA API to lighter
 * weight internal representations from inside the plugin. Since these entities
 * are often logged, serialized, and pass over the CocoaScript-JavaScript
 * (which has memory constraints), it's good practice to keep them as slim as
 * possible.
 */

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

/**
 * @param {Object} issue a JSON issue from the JIRA REST API (see
 * https://docs.atlassian.com/jira/REST/cloud/#api/2/issue-getIssue)
 * @return {Object} a simpler representation of the issue. Notably: important
 * fields are promoted from the 'fields' property to the root, and the
 * attachments are sorted by reverse creation order.
 */
export function issueFromRest (issue) {
  const { issuetype, attachment, summary, assignee, reporter, status } = issue.fields
  // we always display attachments by created date
  const attachments = attachment ? sortBy(attachment, 'created').reverse() : []
  return assign(
    pick(issue, 'key', 'self'),
    {
      summary,
      type: issuetype ? pick(issuetype, typeProperties) : null,
      attachments,
      assignee,
      reporter,
      status
    }
  )
}

/**
 * @param {Object} attachment a JSON attachment from the JIRA REST API. (see
 * https://docs.atlassian.com/jira/REST/cloud/#api/2/attachment-getAttachment)
 * @return {Object} a representation of the attachment with a restricted set of
 * properties.
 */
export function attachmentFromRest (attachment) {
  return pick(attachment, attachmentProperties)
}
