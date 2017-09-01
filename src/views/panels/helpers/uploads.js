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

/**
 * Handles uploading files to JIRA as attachments.
 */
export default class Uploads {
  constructor (context, webUI, jira, attachments) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.attachments = attachments
    this.uploadQueue = new Queue(attachmentUploadConcurrency, Infinity)
  }

  /**
   * @return {Object[]} an array of file objects from the system drag
   * pasteboard. See `fileUrlToUploadInfo` for documentation regarding the
   * object's properties.
   */
  getDroppedFiles () {
    const droppedFiles = getDraggedFiles().map(fileUrlToUploadInfo)
    postAnalytics(droppedFiles, this.uploadQueue.getPendingLength() > 0)
    return droppedFiles
  }

  /**
   * Export the currently selected layers the currently selected issue using
   * the layers' configured export options.
   */
  async exportSelectedLayersToSelectedIssue () {
    executeSafelyAsync(this.context, async () => {
      const issueKey = getSelectedIssueKey()
      if (!issueKey) {
        error('No issue selected, ignoring export request')
        return
      }
      const document = documentFromContext(this.context)
      if (!document) {
        error('Couldn\'t resolve document from context')
        return
      }
      const paths = await exportSelection(document)
      trace(`Exported paths from selection: ["${paths.join('", "')}"]`)
      this.webUI.invokeExposedFunction(
        'exportSelectionToSelectedIssue', issueKey, paths.map(fileUrlToUploadInfo)
      )
    })
  }

  /**
   * @param {string} issueKey identifies the issue to upload the attachment to
   * @param {Object} attachment the attachment to upload
   * @param {string} attachment.path the file path to the attachment
   * @param {function} progress a callback function periodically invoked with
   * the percentage of upload complete (a Number between 0 and 1).
   * @return {Promise<object>} the uploaded attachment object
   */
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

/**
 * @param {string} fileUrlString a local file url
 * @return {Object} an attachment object representing the file being uploaded
 */
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

/**
 * Transmits analytics about the number of files, the file extension, and
 * whether multiple uploads are occurring concurrently.
 * @param {Object[]} files the files being uploaded
 * @param {boolean} alreadyUploading whether an upload is already in progress
 */
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
