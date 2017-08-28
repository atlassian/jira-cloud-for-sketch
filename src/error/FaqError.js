export default class FaqError {
  constructor (message, faqTopic) {
    this.name = 'FaqError'
    this.faqTopic = faqTopic
    this.message = message
    this.stack = new Error().stack
  }
}

export const faqTopics = {
  CAN_NOT_CONNECT: 'can-not-connect',
  CONTACT_SUPPORT: 'contact-support',
  NO_PERMISSION: 'no-permission',
  FILE_TOO_LARGE: 'limits'
}
