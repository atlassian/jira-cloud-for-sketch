# Atlassian Sketch Plugin

A Sketch plugin that provides integration with JIRA Cloud.

# Developing

- `npm install` to install dependencies
- `npm install -g skpm` to install the [Sketch plugin manager](https://www.npmjs.com/package/skpm)
- `skpm build` to transpile and package the plugin
- `skpm link .` to symlink the plugin to the Sketch plugins directory

When you next start Sketch, there should be a **JIRA** option in the
**Plugins** menu.

To subsequently update the plugin, simply run `skpm build` and restart Sketch.

## AtlassianSketchFramework (Objective-C)

If you change the Objective-C `AtlassianSketchFramework` package, you'll need
to rebuild the project using the `./build.sh` script instead of `skpm build`.
Make sure you commit any changes to the generated `AtlassianSketchFramework`
binaries alongside their corresponding source changes.

# Architecture
