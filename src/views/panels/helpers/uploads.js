import moment from 'moment'
import mime from 'mime-types'
import {
  randomHex,
  fileAttributes
} from '../../../util'
import { getDraggedFiles } from '../../../pasteboard'
import { isTraceEnabled, trace, error } from '../../../logger'
import { jiraDateMomentFormat, attachmentUploadConcurrency } from '../../../config'
import { executeSafelyAsync } from '../../../util'
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
    return getDraggedFiles().map(fileUrlToUploadInfo)
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
      const paths = await exportSelection(this.context, issueKey)
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
