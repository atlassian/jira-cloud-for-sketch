# JIRA Cloud for Sketch

A [Sketch] plugin that provides integration with JIRA Cloud.

This README.md is primarily for developers. The latest plugin version,
documentation, FAQ, etc. are hosted at [sketch.atlassian.com].

This plugin's canonical repository is [on Bitbucket], but is also
[mirrored on GitHub]. Contributions are accepted via either service.

## Developing

- Uninstall any previous versions of the Atlassian Sketch plugin from Sketch
- `npm install` to install dependencies
- `npm install -g skpm` to install the [Sketch plugin manager]
- `skpm build` to transpile and package the plugin
- `skpm link .` to symlink the plugin to the Sketch plugins directory

When you next start Sketch, there should be a **JIRA** option in the
**Plugins** menu.

To subsequently update the plugin, simply run `skpm build` and restart Sketch.

### AtlassianSketchFramework (Objective-C)

If you change files under the Objective-C `AtlassianSketchFramework` package,
you'll need to rebuild the project using the `./build.sh` script instead of
`skpm build`. Make sure you commit any changes to the generated
`AtlassianSketchFramework` binaries alongside their corresponding source
changes.

### Builds

Builds are continuously built by Bitbucket Pipelines. See
`bitbucket-pipelines.yml` and `bitbucket-pipelines.sh` for details. Builds are
automatically uploaded to S3:

- https://s3-us-west-2.amazonaws.com/atlassian-sketch-plugin/jira.sketchplugin-latest.zip is the tip of `master`
- https://s3-us-west-2.amazonaws.com/atlassian-sketch-plugin/jira.sketchplugin-release.zip is the latest tag
- https://s3-us-west-2.amazonaws.com/atlassian-sketch-plugin/jira.sketchplugin-{TAG}.zip is a particular tag
- https://s3-us-west-2.amazonaws.com/atlassian-sketch-plugin/jira.sketchplugin-{SHA}.zip is a particular commit

The build environment is defined by the `Dockerfile` in the repository root.

If you want to cut your own build to send to a friend, simply run `skpm build`
(or `./build.sh` if you've modified any Objective-C files) and then zip the
`jira.sketchplugin` directory.

### Architecture

#### Frontend/Backend

The plugin 'backend' uses [CocoaScript] to implement Sketch commands, store
user preferences, make requests to JIRA, add controls to the Sketch UI, and
spawn Cocoa `NSPanel`s and `WebView`s that render the 'frontend'. The frontend
is client-side JavaScript that runs in a `WebView` (that is, Safari) context.
'Backend' and 'frontend' are in quotes because they aren't a traditional
client/server frontend/backend:  both actually run on the user's computer.
However they run in vastly different script contexts, which must be carefully
bridged (see `src/views/bridge` for details).

The frontend uses [React] and [AtlasKit] for the user interface, and [mobx]
for state management. Both the frontend and backend are compiled with [Webpack]
and [Babel] for shiny new ES6/ES8/etc language features. In particular, the
plugin makes heavy use of async/await, arrow functions, classes,
export/imports, decorators, and the spread operator, so you may want to read
up on them if you see some syntax in the codebase that you haven't seen
before.

The backend is also partially implemented in Objective-C to work
around a couple of CocoaScript's limitations, but CocoaScript is strongly
preferred where possible. The plugin does not make use of CocoaScript's square
bracket syntax (I suspect webpack will fall over if you try to use it), but I
believe everything can be expressed in JavaScript style. The backend also uses
a heap of Cocoa classes (see the `globals` section in `.eslintrc`) for a more
or less complete list. These are only present in the CocoaScript context, and
must be stubbed out for tests. Care should be taken not to include CocoaScript
dependencies in frontend code, as the Cocoa classes will be missing from the
frontend context.

#### Persistence

Most configuration is stored in user modifiable file at
`jira.sketchplugin/Contents/Resource/config.json`. This file is read once
at startup (see `src/config.js`), so Sketch will need to be restarted to pick
up any modifications.

Properties and settings that are modified at runtime are stored in a macOS
`plist` that lives at `~/Library/Preferences/plugin.sketch.jira-sketch-plugin`
(see `src/prefs.js`).

#### JIRA authentication and integration

The plugin uses a companion [Atlassian Connect] add-on to integrate with JIRA
Cloud. The add-on allows a user to securely link a plugin instance to their
JIRA Cloud account via an OAuth-like 'dance' and subsequently providing
[bearer tokens] for plugin instances to authenticate directly with the JIRA
REST API (see `src/auth.js` and `src/jira.js` for details). The companion
add-on is a system add-on, and will be automatically installed in any given
JIRA Cloud instance.

#### Logging

Logs are sent to the Sketch provided `log` function, which writes to
`~/Library/Logs/com.bohemiancoding.sketch3/Plugin Output.log`. This file is
cleared automatically by Sketch on startup. I recommend browsing logs using
`Console.app` and filtering by `process:sketch`. Most logging in the plugin
is logged at `trace` or `error` level. The current log level can be configured
via `config.json` (see *Persistance* above).

## Contributing

Pull requests, issues and comments are welcomed. For pull requests:

* Follow the existing style
* Separate unrelated changes into multiple pull requests

For bigger changes, make sure you start a discussion first by creating
an issue and explaining the intended change.

Atlassian requires contributors to sign a Contributor License Agreement,
known as a CLA. This serves as a record stating that the contributor is
entitled to contribute the code/documentation/translation to the project
and is willing to have it used in distributions and derivative works
(or is willing to transfer ownership).

Prior to accepting your contributions we ask that you please follow the appropriate
link below to digitally sign the CLA. The Corporate CLA is for those who are
contributing as a member of an organization and the individual CLA is for
those contributing as an individual.

* [CLA for corporate contributors](https://na2.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=e1c17c66-ca4d-4aab-a953-2c231af4a20b)
* [CLA for individuals](https://na2.docusign.net/Member/PowerFormSigning.aspx?PowerFormId=3f94fbdc-2fbe-46ac-b14c-5d152700ae5d)

## Code of conduct

This project is bound by a [code of conduct].

[Sketch]: https://sketchapp.com/
[sketch.atlassian.com]: https://sketch.atlassian.com
[on Bitbucket]: https://bitbucket.org/atlassian/jira-cloud-for-sketch
[mirrored on GitHub]: https://github.com/atlassian/jira-cloud-for-sketch
[Sketch plugin manager]: https://www.npmjs.com/package/skpm
[CocoaScript]: http://developer.sketchapp.com/introduction/cocoascript/
[React]: https://facebook.github.io/react/
[AtlasKit]: https://atlaskit.atlassian.com/
[mobx]: https://mobx.js.org/
[Webpack]: https://webpack.js.org/
[Babel]: https://babeljs.io/
[Atlassian Connect]: https://developer.atlassian.com/cloud/jira/platform/integrating-with-jira-cloud/
[bearer tokens]: https://developer.atlassian.com/cloud/jira/platform/oauth-2-jwt-bearer-token-authorization-grant-type/
[code of conduct]: ./CODE_OF_CONDUCT.md
