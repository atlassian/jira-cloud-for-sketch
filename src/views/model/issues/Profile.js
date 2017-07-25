import { assign } from 'lodash'

export default class Profile {
  constructor (profile) {
    assign(this, profile)
  }
}
