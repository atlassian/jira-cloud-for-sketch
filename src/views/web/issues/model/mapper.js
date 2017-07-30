import Attachment from './Attachment'
import Filter from './Filter'
import Issue from './Issue'
import Profile from './Profile'

export function FilterMapper (filterJson) {
  return new Filter(filterJson)
}

export function FiltersMapper (filtersJson) {
  return filtersJson.map(FilterMapper)
}

export function IssueMapper (issueJson) {
  const attachments = issueJson.attachments.map(AttachmentMapper)
  delete issueJson.attachments
  return new Issue(issueJson, attachments)
}

export function IssuesMapper (issuesJson) {
  return issuesJson.map(IssueMapper)
}

export function AttachmentMapper (attachmentJson) {
  return new Attachment(attachmentJson)
}

export function AttachmentsMapper (attachmentsJson) {
  return attachmentsJson.map(AttachmentMapper)
}

export function ProfileMapper (profileJson) {
  return new Profile(profileJson)
}
