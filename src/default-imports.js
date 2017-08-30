/*
 * Scripts that must be included *first* in every entry point, e.g. all Sketch
 * commands and action handlers.
 */

import 'babel-polyfill'
import './frameworks/AtlassianSketchFramework'
import upgradeIfNeeded from './upgrade/upgrade'

upgradeIfNeeded()
