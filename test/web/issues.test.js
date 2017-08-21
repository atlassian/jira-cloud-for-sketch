import 'chromedriver'
import 'babel-polyfill'
import test from 'ava'
import { HttpServer } from 'http-server'
import path from 'path'
import webdriver, { By, until } from 'selenium-webdriver'
import { invocationKeyForTests as tk } from '../../src/views/bridge/common'

// test data
import { jqlFilterArray } from '../../src/jql-filters'
import { issueFromRest } from '../../src/entity-mappers'
const issues = require('./issues.json').issues.map(issueFromRest)
const profile = require('./profile.json')

const root = path.join(__dirname, '/../../atlassian.sketchplugin/Contents/Resources')
new HttpServer({root}).listen(8080)

let driver

test.before(async () => {
  driver = await new webdriver.Builder()
    .forBrowser('chrome')
    .build()

  // Resizing is currently broken in Safari: https://github.com/SeleniumHQ/selenium/issues/3796
  // await driver.manage().window().setSize(512, 400)
})

test.serial('Test plugin initializes', async t => {
  await driver.get('http://localhost:8080/issues.html')
  await driver.wait(until.titleIs('Issues'), 1000)
  await driver.wait(() => {
    return driver.executeScript('return window.__addBridgeResponsesForTests != undefined')
  }, 5000)
  await driver.executeScript(getTestDataScript())

  function getIssuesInList () {
    return driver.findElements(By.css('.issue'))
  }
  await driver.wait(
    async () => { return (await getIssuesInList()).length > 0 },
    1000
  )

  const issueList = await getIssuesInList()
  t.is(issueList.length, 10)

  const firstIssue = issueList[0]
  t.is(
    await firstIssue.findElement(By.css('.issue-type')).getAttribute('title'),
    'Bug'
  )
  t.is(
    await firstIssue.findElement(By.css('.issue-key')).getText(),
    'SFJ-29'
  )
  t.is(
    await firstIssue.findElement(By.css('.issue-summary')).getText(),
    'Show loading indicator & download attachment thumbnails in parallel'
  )
  t.is(
    await firstIssue.findElement(By.css('.issue-assignee')).getAttribute('title'),
    'Assigned to Tim Pettersen'
  )
})

test.after.always(() => {
  driver && driver.quit()
})

const bridgedFunctionResponses = {}

bridgedFunctionResponses[tk('loadFilters')] = {result: jqlFilterArray, once: true}
bridgedFunctionResponses[tk('loadProfile')] = {result: profile, once: true}
bridgedFunctionResponses[tk('loadIssuesForFilter', 'RecentlyViewed')] = {result: issues}

function getTestDataScript () {
  return `window.__addBridgeResponsesForTests(${JSON.stringify(bridgedFunctionResponses)})`
}
