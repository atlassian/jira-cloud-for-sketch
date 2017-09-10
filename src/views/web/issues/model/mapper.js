import Attachment from './Attachment'
import Filter from './Filter'
import Issue from './Issue'
import Profile from './Profile'

export function FilterMapper (filterJson) {
  if (!filterJson) return null
  return new Filter(filterJson)
}

export function FiltersMapper (filtersJson) {
  return filtersJson.map(FilterMapper)
}

export function IssueMapper (issueJson) {
  if (!issueJson) return null
  const attachments = issueJson.attachments.map(AttachmentMapper)
  delete issueJson.attachments
  return new Issue(issueJson, attachments)
}

export function IssuesMapper (issuesJson) {
  return issuesJson.map(IssueMapper)
}

export function AttachmentMapper (attachmentJson) {
  if (!attachmentJson) return null
  return new Attachment(attachmentJson)
}

export function AttachmentsMapper (attachmentsJson) {
  return attachmentsJson.map(AttachmentMapper)
}

export function ProfileMapper (profileJson) {
  if (!profileJson) return null
  return new Profile(profileJson)
}
