import { observable } from 'mobx'
import bridgedFunctionCall from '../../../bridge/client'
import { analytics } from '../../util'
import { uniqBy, without } from 'lodash'

const atMentionRegex = /(@\w*( \w*){0,2})$/

const _openInBrowser = bridgedFunctionCall('openInBrowser')
const _findUsersForPicker = bridgedFunctionCall('findUsersForPicker')
const _addComment = bridgedFunctionCall('addComment')

export default class CommentEditor {
  @observable text = ''
  @observable isFocused = false
  @observable isPosting = false
  @observable href = null
  @observable mentions = []
  @observable defaultMentions = []
  @observable inputRef = null
  @observable mentionListRef = null

  constructor (issue) {
    this.issueKey = issue.key
    this.initDefaultMentions(issue)
  }

  initDefaultMentions (issue) {
    this.defaultMentions.replace(
      uniqBy( // in case assignee == reporter
        without( // remove nulls
          ['assignee', 'reporter'].map(field => {
            let user = issue[field]
            return user && user.active ? mentionFromUser(user) : null
          })
        , null)
      , 'id')
    )
  }

  onTextChanged (newText) {
    this.text = newText
    this.checkForMentions()
  }

  checkForMentions () {
    const mention = this.findMentionUnderCaret()
    if (mention === '@') {
      this.mentions.replace(this.defaultMentions)
    } else if (mention) {
      this.loadMentions(mention)
    } else {
      this.clearMentions()
    }
  }

  findMentionUnderCaret () {
    const input = this.inputRef
    if (input && input.selectionStart === input.selectionEnd) {
      const mention = input.value.substring(0, input.selectionStart).match(atMentionRegex)
      if (mention) {
        return mention[1]
      }
    }
  }

  onKeyDown (event) {
    if (this.isFocused && this.mentions.length && this.mentionListRef) {
      // mention list is open, steal enter and cursor keys
      switch (event.keyCode) {
        case 13: // enter
          event.preventDefault()
          this.mentionListRef.chooseCurrentSelection()
          break
        case 38: // up
          event.preventDefault()
          this.mentionListRef.selectPrevious()
          break
        case 40: // down
          event.preventDefault()
          this.mentionListRef.selectNext()
          break
      }
    } else if (event.keyCode === 13) {
      // enter = submit, shift+enter = insert line break
      if (!event.shiftKey) {
        event.preventDefault()
        this.postComment()
      }
    }
  }

  async loadMentions (mention) {
    const query = mention.substring(1) // trim leading '@'
    this.loadingMentionQuery = query
    const users = await _findUsersForPicker(query)
    if (this.loadingMentionQuery === query) {
      this.mentions.replace(users.map(mentionFromUser))
    }
  }

  clearMentions () {
    this.loadingMentionQuery = null
    this.mentions.replace([])
  }

  onMentionSelected (selection) {
    let mention = this.findMentionUnderCaret()
    if (!mention) {
      return
    }

    // replace the @mention with the correct JIRA syntax
    const input = this.inputRef
    const precedingText = input.value.substring(0, input.selectionStart - mention.length)
    const trailingText = input.value.substring(input.selectionStart)
    let textToInsert = `[~${selection.mentionName}]`
    if (precedingText.charAt(precedingText.length - 1) === ' ') {
      // auto-insert a trailing space iff the @mention is preceded by a space
      textToInsert += ' '
    }
    this.text = `${precedingText}${textToInsert}${trailingText}`

    // move caret to end of inserted @mention
    input.selectionStart = input.selectionEnd = precedingText.length + textToInsert.length

    this.mentions.replace([])
  }

  async postComment () {
    if (!this.isPosting && this.text.trim()) {
      this.isPosting = true
      this.href = await _addComment(this.issueKey, this.text)
      this.text = ''
      this.isPosting = false
    }
  }

  openPostedCommentInBrowser () {
    if (this.href) {
      _openInBrowser(this.href)
      analytics('viewIssueOpenCommentInBrowser')
    }
  }
}

/**
 * Converts a JSON user representation from a /api/2/issue field or
 * /api/2/user/picker into a user object suitable for displaying in
 * an AtlasKit MentionList.
 */
function mentionFromUser (restUser) {
  let avatarUrl = null
  if (restUser.avatarUrls) {
    avatarUrl = restUser.avatarUrls['32x32']
  } else if (restUser.avatarUrl) {
    // HACK: JIRA's /user/picker API returns tiny avatars by default. Here we
    // override the 's' parameter to get the desired resolution
    avatarUrl = restUser.avatarUrl.replace(/[?&]s=\d+/, str => {
      return str.charAt(0) + 's=32'
    })
  }
  return {
    id: restUser.key,
    avatarUrl,
    name: restUser.displayName,
    mentionName: restUser.name,
    nickname: restUser.name
  }
}
