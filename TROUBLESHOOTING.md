# Troubleshooting Guide

Like many Sketch plugins, JIRA Cloud for Sketch indulges in some slightly risky behaviour in order to provide a more compelling user experience. This includes:

1. Invoking Sketch's internal classes directly
2. Invoking classes provided by some of Sketch's dependencies (i.e. AFNetworking)
3. Modifying properties of NSView instances created by Sketch
4. Adding new subviews to NSView instances created by Sketch
5. Using deprecated Cocoa classes

Items 1 through 4 may potentially break after a Sketch upgrade, if the developers change or remove a class, dependency, or UI element that we depend on. Item 5 is less likely to cause issues, but may eventually break due to a macOS update that removes a deprecated class that we depend on.

We've made some effort to minimize the risk of failure, and to degrade gracefully (i.e. avoid crashing Sketch) in case of failure. However, depending on the nature of the underlying change, the failure mode may vary. This guide is designed to help an end user or support engineer remedy problems if they occur.

## Symptoms & remedies

### Sketch starts, but the 'Export to JIRA' button doesn't appear in the 'Export' panel

If the user has recently upgraded Sketch, the UI layout may have changed in such a way that the plugin can no longer find the correct `NSView` to add the 'Export to JIRA' button to. As a workaround, it should still be possible to export images by using the 'JIRA' item in the 'Plugin' menu, or by pressing `⌘+⌥+J`. Please also [raise an issue] for the plugin maintainers to investigate.

### Sketch starts, but the JIRA button doesn't appear in the menu

This usually indicates that the plugin isn't actually installed. Please try [downloading and re-installing the plugin]. If symptoms persist, [raise an issue] for the plugin maintainers to investigate.

### Sketch fails to start, or crashes on startup

This may be a problem caused by a Sketch plugin. To determine which plugin is causing the issue, try removing them one-by-one from the Sketch plugin's directory at `~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/` and reproducing the crash. If the offending plugin is JIRA Cloud for Sketch, please [raise an issue] for the plugin maintainers to investigate. 

If the broken plugin is critical to your workflow, you may downgrade Sketch by [downloading and installing an earlier version].

### Sketch starts, but some of the plugin's functionality is broken

This could indicate that one of the Objective-C classes depended on by the plugin has changed, or a bug in the plugin. Please [raise an issue] for the plugin maintainers to investigate. You can also try the other troubleshooting steps below.

## Other troubleshooting steps

### Check the logs

Plugin logs are written to `~/Library/Logs/com.bohemiancoding.sketch3/Plugin Output.log`. This file is cleared by Sketch on startup, so be sure to reproduce the issue before capturing the logs.

### Check for client-side JavaScript errors

The plugin's UI is provided by a Safari WebView. You can view errors logged to the Safari console by:

1. Enabling the [Safari Develop menu]
2. Right-clicking on the JIRA panel and selecting 'Inspect Element'
3. Clicking on `Console`

Warnings and errors will be displayed in yellow and red, respectively. Note that there are a couple of known but bengign issues with a couple of the plugin's dependencies. Warnings about PropTypes and failures to load `.js.map` files are usually safe to ignore.

### Clear plugin settings

Plugin settings are stored in `~/Library/Preferences/plugin.sketch.jira-sketch-plugin.plist`. You can view these settings with the following command:

`/usr/bin/defaults read ~/Library/Preferences/plugin.sketch.jira-sketch-plugin`

Or clear these settings with:

`/usr/bin/defaults delete ~/Library/Preferences/plugin.sketch.jira-sketch-plugin`

NOTE: the `authToken` stored in the plist is a temporary bearer token valid for a short period (~15 minutes, at time of writing) from creation. Do not share tokens that are still valid with others, or post them on the Internet, etc.

### Verify or tweak configuration settings

Various configuration settings (log levels, refresh intervals, etc.) can be modified by editing `jira.sketchplugin/Contents/Resources/config.json`. 

### Create a development build

To aid in diagnosis, you may wish to add additional logging to the plugin and create a development build. Check `README.md` for a guide to building the plugin. 

Or, if you're feeling brave, you can modify the transpiled CocoaScript in `jira.sketchplugin/Contents/Sketch/*.js` or transpiled JavaScript in `jira.sketchplugin/Contents/Resources/*.js`. Note that you'll need to restart Sketch to pick up any changes.

[raise an issue]: https://github.com/atlassian/jira-cloud-for-sketch/issues
[re-installing the plugin]: https://sketch.atlassian.com
[downloading and installing an earlier version]: https://www.sketchapp.com/updates/
[enabling the Safari Develop menu]: https://apple.stackexchange.com/a/139771
