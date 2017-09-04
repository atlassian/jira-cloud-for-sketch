import { observable } from 'mobx'
import { bridgedFunction } from '../../../bridge/client'
import { analytics } from '../../util'
import { uniqBy, without, debounce } from 'lodash'

const atMentionRegex = /(@\w*( \w*){0,2})$/
const atMentionDebounceDelay = 250 // sticks finger in mouth, raises to wind

const _openInBrowser = bridgedFunction('openInBrowser')
const _findUsersForPicker = bridgedFunction('findUsersForPicker')
const _addComment = bridgedFunction('addComment')
const _getWatchers = bridgedFunction('getWatchers')

export default class CommentEditor {
  @observable text = ''
  @observable isFocused = false
  @observable isPosting = false
  @observable href = null
  @observable mentions = []
  @observable defaultMentions = []
  @observable inputRef = null
  @observable mentionListRef = null
  @observable isDisplayingDefaultMentions = false

  constructor (issue) {
    this.issueKey = issue.key
    this.loadMentions = debounce(
      this.loadMentions,
      atMentionDebounceDelay,
      {trailing: true}
    ).bind(this)
    this.resetDefaultMentions(issue)
  }

  replaceDefaultMentions (mentions) {
    this.defaultMentions.replace(
      // remove dupes & nulls
      uniqBy(without(mentions, null), 'id')
    )
  }

  resetDefaultMentions (issue) {
    this.replaceDefaultMentions(['assignee', 'reporter'].map(field => {
      return mentionFromUser(issue[field])
    }))
  }

  async onIssueUpdated (issue) {
    this.resetDefaultMentions(issue)
    // use mutex to guard against user selecting/deselecting multiple times
    const mutex = this.watchersMutex = new Date().getTime()
    const watchers = await _getWatchers(this.issueKey)
    if (mutex == this.watchersMutex) {
      this.replaceDefaultMentions(
        this.defaultMentions.slice().concat(
          watchers.map(mentionFromUser)
        )
      )
    }
  }

  onTextChanged (newText) {
    this.text = newText
    this.checkForMentions()
  }

  checkForMentions () {
    const mention = this.findMentionUnderCaret()
    if (mention === '@') {
      this.mentions.replace(this.defaultMentions)
      this.isDisplayingDefaultMentions = true
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
      // mention list is open, steal relevant keys
      switch (event.keyCode) {
        case 13: // enter
        case 9: // tab
          event.preventDefault()
          this.mentionListRef.chooseCurrentSelection()
          break
        case 27: // escape
          event.preventDefault()
          this.clearMentions()
          break
        case 32: // space
          if (this.mentions.length === 1 && !this.isDisplayingDefaultMentions) {
            // auto-insert a single mention result, as long as it's not a default
            event.preventDefault()
            this.mentionListRef.chooseCurrentSelection()
          }
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

  // debounced, see constructor
  async loadMentions (mention) {
    const query = mention.substring(1) // trim leading '@'
    this.loadingMentionQuery = query
    const users = await _findUsersForPicker(query)
    if (this.loadingMentionQuery === query) {
      this.mentions.replace(users.map(mentionFromUser))
      this.isDisplayingDefaultMentions = false
    }
  }

  clearMentions () {
    this.loadingMentionQuery = null
    this.mentions.replace([])
    this.isDisplayingDefaultMentions = false
  }

  onMentionSelected (selection) {
    let mention = this.findMentionUnderCaret()
    if (!mention) {
      return
    }

    // replace the @mention with the correct Jira syntax
    const input = this.inputRef
    const precedingText = input.value.substring(0, input.selectionStart - mention.length)
    const trailingText = input.value.substring(input.selectionStart)
    let textToInsert = `[~${selection.mentionName}]`
    if (precedingText.length === 0 || precedingText.charAt(precedingText.length - 1) === ' ') {
      // auto-insert a trailing space if the @mention is preceded by space or start of line
      textToInsert += ' '
    }
    this.text = `${precedingText}${textToInsert}${trailingText}`

    // move caret to end of inserted @mention
    input.selectionStart = input.selectionEnd = precedingText.length + textToInsert.length

    analytics('selectAtMention')

    this.clearMentions()
  }

  async postComment () {
    if (!this.isPosting && this.text.trim()) {
      this.href = null
      this.isFocused = false
      this.isPosting = true
      this.href = await _addComment(this.issueKey, this.text)
      analytics('addComment', {
        length: this.text.length,
        lines: this.text.split('\n').length
      })
      this.text = ''
      this.isPosting = false
    }
  }

  openPostedCommentInBrowser () {
    if (this.href) {
      _openInBrowser(this.href)
      analytics('openCommentInBrowser')
    }
  }
}

/**
 * Converts a JSON user representation from a /api/2/issue field or
 * /api/2/user/picker into a user object suitable for displaying in
 * an AtlasKit MentionList.
 *
 * Returns null if the user is supplied user is null or inactive.
 */
function mentionFromUser (restUser) {
  if (!restUser) {
    return null
  }
  // n.b. active flag is not set on responses from /user/picker
  if (restUser.active === false) {
    return null
  }
  let avatarUrl = null
  if (restUser.avatarUrls) {
    avatarUrl = restUser.avatarUrls['32x32']
  } else if (restUser.avatarUrl) {
    // HACK: Jira's /user/picker API returns tiny avatars by default. Here we
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
