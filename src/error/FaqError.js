/**
 * Indicates an expected error case has occurred. If thrown, the UI should
 * display the supplied message and link to the relevant FAQ page.
 */
export default class FaqError {
  /**
   * @param {string} message a descriptive message to be displayed to the user
   * @param {string} faqTopic a relevant FAQ topic the user can browse to
   */
  constructor (message, faqTopic) {
    this.name = 'FaqError'
    this.faqTopic = faqTopic
    this.message = message
    this.stack = new Error().stack
  }
}

/**
 * Property values correspond to anchors at https://sketch.atlassian.com/faq
 */
export const faqTopics = {
  CAN_NOT_CONNECT: 'can-not-connect',
  CONTACT_SUPPORT: 'contact-support',
  NO_PERMISSION: 'no-permission',
  FILE_TOO_LARGE: 'limits'
}
