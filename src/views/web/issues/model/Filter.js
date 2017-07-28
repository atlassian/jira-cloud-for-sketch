import { assign } from 'lodash'

export default class Filter {
  constructor (filter) {
    assign(this, filter)
  }
}
