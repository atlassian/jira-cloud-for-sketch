import moment from 'moment'
import mime from 'mime-types'
import {
  randomHex,
  fileAttributes
} from '../../../util'
import { getDraggedFiles } from '../../../pasteboard'
import { isTraceEnabled, trace, error } from '../../../logger'
import { jiraDateMomentFormat, attachmentUploadConcurrency } from '../../../config'
import { postMultiple, event } from '../../../analytics'
import { documentFromContext, executeSafelyAsync } from '../../../util'
import { getSelectedIssueKey } from '../../../plugin-state'
import { exportSelection } from '../../../export'
import { attachmentFromRest } from '../../../entity-mappers'
import Queue from 'promise-queue'

export default class Uploads {
  constructor (context, webUI, jira, attachments) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.attachments = attachments
    this.uploadQueue = new Queue(attachmentUploadConcurrency, Infinity)
  }

  getDroppedFiles () {
    const droppedFiles = getDraggedFiles().map(fileUrlToUploadInfo)
    postAnalytics(droppedFiles, this.uploadQueue.getPendingLength() > 0)
    return droppedFiles
  }

  async exportSelectedLayersToSelectedIssue () {
    executeSafelyAsync(this.context, async () => {
      const issueKey = getSelectedIssueKey()
      if (!issueKey) {
        error('No issue selected, ignoring export request')
        return
      }
      const document = documentFromContext(this.context)
      if (!document) {
        trace('Couldn\'t resolve document from context')
        return
      }
      const paths = await exportSelection(document)
      trace(`Exported paths from selection: ["${paths.join('", "')}"]`)
      this.webUI.dispatchWindowEvent(
        'jira.export.selection.to.issue', {
          issueKey,
          files: paths.map(fileUrlToUploadInfo)
        }
      )
    })
  }

  async uploadAttachment (issueKey, attachment, progress) {
    return this.uploadQueue.add(async () => {
      trace(`attaching ${attachment.path} to ${issueKey}`)
      const resp = await this.jira.uploadAttachment(
        issueKey,
        attachment.path,
        (completed, total) => {
          progress(completed / total)
        }
      )
      const json = await resp.json()
      if (isTraceEnabled()) {
        trace(JSON.stringify(json))
      }
      return attachmentFromRest(json[0])
    })
  }
}

function fileUrlToUploadInfo (fileUrlString) {
  const fileUrl = NSURL.URLWithString(fileUrlString)
  const extension = fileUrl.pathExtension() + ''
  const path = fileUrl.path() + ''
  const attributes = fileAttributes(path)
  return {
    id: randomHex(0xffffffff),
    filename: fileUrl.lastPathComponent() + '',
    path,
    created: moment().format(jiraDateMomentFormat),
    extension,
    size: parseInt(attributes[NSFileSize] + ''),
    mimeType: mime.lookup(extension)
  }
}

async function postAnalytics (files, alreadyUploading) {
  var events = files.map(file => {
    return event(
      'viewIssueAttachmentUpload',
      file.extension ? {extension: file.extension} : null
    )
  })
  if (files.length > 1) {
    events.push(event('viewIssueMultipleAttachmentUpload', {
      count: files.length,
      alreadyUploading
    }))
  } else {
    events.push(event('viewIssueSingleAttachmentUpload', { alreadyUploading }))
  }
  postMultiple(events)
}
