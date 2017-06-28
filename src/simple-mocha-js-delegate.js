/**
 * Based on Matt Curtis' MochaJSDelegate
 * https://github.com/matt-curtis/MochaJSDelegate/blob/77a40a97c992fd7b567b1171cddfc4b432503881/MochaJSDelegate.js
 *
 * This version _does not_ have dynamic selector handlers. Passed in handler
 * functions must have the correct number of arguments!
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Matt Curtis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export default function (selectorHandlerDict) {
  var uniqueClassName =
    'MochaJSDelegate_DynamicClass_' + NSUUID.UUID().UUIDString()

  var delegateClassDesc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(
    uniqueClassName,
    NSObject
  )

  delegateClassDesc.registerClass()

  var handlers = {}

  this.setHandlerForSelector = function (selectorString, func) {
    var handlerHasBeenSet = selectorString in handlers
    var selector = NSSelectorFromString(selectorString)
    handlers[selectorString] = func
    if (!handlerHasBeenSet) {
      delegateClassDesc.addInstanceMethodWithSelector_function_(selector, func)
    }
  }

  this.removeHandlerForSelector = function (selectorString) {
    delete handlers[selectorString]
  }

  this.getHandlerForSelector = function (selectorString) {
    return handlers[selectorString]
  }

  this.getAllHandlers = function () {
    return handlers
  }

  this.getClass = function () {
    return NSClassFromString(uniqueClassName)
  }

  this.getClassInstance = function () {
    return NSClassFromString(uniqueClassName).new()
  }

  if (typeof selectorHandlerDict == 'object') {
    for (var selectorString in selectorHandlerDict) {
      this.setHandlerForSelector(selectorString, selectorHandlerDict[selectorString])
    }
  }
}
