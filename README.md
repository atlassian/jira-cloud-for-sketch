# JIRA Sketch Plugin

A Sketch plugin that provides integration with JIRA, via a companion Atlassian Connect add-on ([jira-sketch-integration](https://bitbucket.org/atlassian/jira-sketch-integration))

# Developing

- `npm install -g skpm` to install the [Sketch plugin manager](https://www.npmjs.com/package/skpm)
- `skpm build` to transpile and package the plugin
- `skpm link .` to symlink the plugin to the Sketch plugins directory

When you next start Sketch, there should be a **JIRA** option in the **Plugins** menu.

To subsequently update the plugin, simply run `skpm build` and restart Sketch.
