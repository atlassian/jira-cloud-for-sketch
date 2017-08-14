import { observable } from 'mobx'
import bridgedFunctionCall from '../../../bridge/client'
import { analytics } from '../../util'

const atMentionRegex = /@(\w*( \w*){0,2})$/

const _openInBrowser = bridgedFunctionCall('openInBrowser')
const _findUsersForPicker = bridgedFunctionCall('findUsersForPicker')
const _addComment = bridgedFunctionCall('addComment')

export default class CommentEditor {
  @observable text = ''
  @observable isFocused = false
  @observable isPosting = false
  @observable href = null
  @observable mentions = []
  @observable inputRef = null
  @observable mentionListRef = null

  constructor (issueKey) {
    this.issueKey = issueKey
  }

  onTextChanged (newText) {
    this.text = newText
    this.checkForMentions()
  }

  checkForMentions () {
    const mention = this.findMentionUnderCaret()
    if (mention) {
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

  async loadMentions (query) {
    this.loadingMentionQuery = query
    const users = await _findUsersForPicker(query)
    if (this.loadingMentionQuery === query) {
      this.mentions.replace(users.map(user => {
        // HACK: JIRA returns tiny avatars by default. Here we verride the 's'
        // parameter to get the desired resolution
        const avatarUrl32px = user.avatarUrl.replace(/[?&]s=\d+/, str => {
          return str.charAt(0) + 's=32'
        })
        return {
          id: user.key,
          avatarUrl: avatarUrl32px,
          name: user.displayName,
          mentionName: user.name,
          nickname: user.name
        }
      }))
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
    mention = '@' + mention

    // replace the @mention with the correct JIRA syntax
    const input = this.inputRef
    const precedingText = input.value.substring(0, input.selectionStart - mention.length)
    const trailingText = input.value.substring(input.selectionStart)
    this.text = `${precedingText}[~${selection.mentionName}]${trailingText}`

    // move caret to end of inserted @mention
    input.selectionStart = input.selectionEnd = precedingText.length + selection.mentionName.length + 3

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
