# Change Log

All notable changes to the Adapt authoring tool are documented in this file.

**IMPORTANT**: For information on how to **correctly and safely** update your installation, please consult **INSTALL.md**.<br/>
_Note that we adhere to the [semantic versioning](http://semver.org/) scheme for release numbering._

## [0.10.3] - 2020-02-21

Bugfix release.

### Fixed
- Cannot remove Spoor's required files from published course ([#2235](https://github.com/adaptlearning/adapt_authoring/issues/2235))
- If I switch theme, the old theme assets still seem to be retained on publish ([#2442](https://github.com/adaptlearning/adapt_authoring/issues/2442))
- Incompatible versions of plugins are targetted if range specified in adapt.json ([#2479](https://github.com/adaptlearning/adapt_authoring/issues/2479))
- Framework and AT use different default screen sizes ([#2485](https://github.com/adaptlearning/adapt_authoring/issues/2485))
- Heavy course validation on front-end ([#2487](https://github.com/adaptlearning/adapt_authoring/issues/2487))

### Added
- Generate a dependency lock on release ([#2301](https://github.com/adaptlearning/adapt_authoring/issues/2301))

## [0.10.2] - 2019-11-08

Bugfix release.

### Fixed
- Asset tags are not preserved on import ([#2439](https://github.com/adaptlearning/adapt_authoring/issues/2439))
- Cannot update plugin via the UI ([#2455](https://github.com/adaptlearning/adapt_authoring/issues/2455))
- Install script hangs when installing legacy framework ([#2457](https://github.com/adaptlearning/adapt_authoring/issues/2457))
- Input box briefly fills screen when enering tags in asset upload modal ([#2460](https://github.com/adaptlearning/adapt_authoring/issues/2460))
- Extensions go missing from components ([#2467](https://github.com/adaptlearning/adapt_authoring/issues/2467))

### Added
- Upgrade script should check for compatible framework updates ([#2307](https://github.com/adaptlearning/adapt_authoring/issues/2307))

## [0.10.1] - 2019-10-22

Bugfix release.

### Fixed
- Courses dashboard: A-Z/Z-A sort is case sensitive ([#2325](https://github.com/adaptlearning/adapt_authoring/issues/2325))
- Item copy can result in broken courseassets in other items ([#2347](https://github.com/adaptlearning/adapt_authoring/issues/2347))
- Allow non-interactive install and upgrade scripts ([#2407](https://github.com/adaptlearning/adapt_authoring/issues/2407))
- installation: missing translation key for app.productname ([#2410](https://github.com/adaptlearning/adapt_authoring/issues/2410))
- Fix reading of asset type from schema ([#2416](https://github.com/adaptlearning/adapt_authoring/issues/2416))
- Grunt tasks do not process symlinks ([#2428](https://github.com/adaptlearning/adapt_authoring/issues/2428))
- Importing plugin with existing targetAttribute causes error when retrieving plugin schemas ([#2433](https://github.com/adaptlearning/adapt_authoring/issues/2433))
- Support Node 12 ([#2437](https://github.com/adaptlearning/adapt_authoring/issues/2437))
- Asset tags are not preserved on import ([#2439](https://github.com/adaptlearning/adapt_authoring/issues/2439))

### Added
- skip-version check should be passed as cli argument ([#2005](https://github.com/adaptlearning/adapt_authoring/issues/2005))
- Plugin upload failed modal should be more descriptive ([#2444](https://github.com/adaptlearning/adapt_authoring/issues/2444))

## [0.10.0] - 2019-08-29

Adds ability to import courses with an older framework version, and latest bugfixes.

### Fixed
- Improve error messages when saving theme preset names ([#2382](https://github.com/adaptlearning/adapt_authoring/issues/2382))
- Theme preset dropdown keeps reverting to 'No preset' ([#2379](https://github.com/adaptlearning/adapt_authoring/issues/2379))
- Manage theme preset button wraps onto second line ([#2361](https://github.com/adaptlearning/adapt_authoring/issues/2361))
- Sometimes a theme is wrongly identified as being editable ([#2360](https://github.com/adaptlearning/adapt_authoring/issues/2360))
- Absolute pikaday path breaks grunt build in some cases ([#2314](https://github.com/adaptlearning/adapt_authoring/issues/2314))
- Course creators cannot see asset tags list ([#2306](https://github.com/adaptlearning/adapt_authoring/issues/2306))
- Upload files not always cleared from tmp ([#2115](https://github.com/adaptlearning/adapt_authoring/issues/2115))
- When 'Add component' is clicked move focus to component search ([#1963](https://github.com/adaptlearning/adapt_authoring/issues/1963))
- Allow for pages without a sidebar ([#1541](https://github.com/adaptlearning/adapt_authoring/issues/1541))

### Added
- Ability to import a course with an older framework version ([#2288](https://github.com/adaptlearning/adapt_authoring/issues/2288))

## [0.9.0] - 2019-07-15

Adds ability to remove plugins, removes unused user roles and latest bugfixes.

### Fixed
- Performance regression when upgrading to v0.8.1 ([#2370](https://github.com/adaptlearning/adapt_authoring/issues/2370))
- Block instruction not being saved ([#2373](https://github.com/adaptlearning/adapt_authoring/issues/2373))
- Not able to select a transparent colour in theme picker ([#2358](https://github.com/adaptlearning/adapt_authoring/issues/2358))
- Not able to specify a select option for theme variable ([#2358](https://github.com/adaptlearning/adapt_authoring/issues/2358))
- No dashboard redirect on invalid page ([#2351](https://github.com/adaptlearning/adapt_authoring/issues/2351))
- Image thumbnail not showing in component settings ([#2345](https://github.com/adaptlearning/adapt_authoring/issues/2345))
- Non-localised text in asset mangement ([#2340](https://github.com/adaptlearning/adapt_authoring/issues/2340))
- Theme variables aren't used in core Less files ([#2338](https://github.com/adaptlearning/adapt_authoring/issues/2338))
- Import times out if course is missing an asset ([#2326](https://github.com/adaptlearning/adapt_authoring/issues/2326))
- Text misaligned on headers ([#2276](https://github.com/adaptlearning/adapt_authoring/issues/2276))

### Added
- Ability to remove plugins ([#928](https://github.com/adaptlearning/adapt_authoring/issues/928))
- Remove unused user roles ([#1950](https://github.com/adaptlearning/adapt_authoring/issues/1950))

## [0.8.1] - 2019-05-23

Bugfix release.

### Fixed
- Publish spinner shows through force rebuild button ([#2295](https://github.com/adaptlearning/adapt_authoring/issues/2295))
- Tag preview not showing via upload asset from component ([#2300](https://github.com/adaptlearning/adapt_authoring/issues/2300))
- hard-coded placeholder text in sidebarFilter.hbs ([#2309](https://github.com/adaptlearning/adapt_authoring/issues/2309))
- Admins can see other users' unshared courses ([#2312](https://github.com/adaptlearning/adapt_authoring/issues/2312))
- No new migrations are run for upgrades ([#2317](https://github.com/adaptlearning/adapt_authoring/issues/2317))

## [0.8.0] - 2019-05-03

Adds a UI to allow the editing of a supported theme.

#### Recommended requirements for full compatibility
Series | Framework | Vanilla
-- | -- | --
2.x | 2.4.0 | [3.1.0](https://github.com/adaptlearning/adapt-contrib-vanilla/releases/tag/v3.1.0)
4.x | 4.2.0 | [4.1.0](https://github.com/adaptlearning/adapt-contrib-vanilla/releases/tag/v4.1.0)

### Fixed
- Custom LESS doesn't work in authoring tools which are running framework version 4 ([#2240](https://github.com/adaptlearning/adapt_authoring/issues/2240))

### Added
- Add UI for theme editing ([#2187](https://github.com/adaptlearning/adapt_authoring/issues/2187))

## [0.7.1] - 2019-04-09

Bugfix release.

### Fixed
- Error not handled when server is already running ([#2174](https://github.com/adaptlearning/adapt_authoring/issues/2174))
- Plugin management text is hardcoded ([#2218](https://github.com/adaptlearning/adapt_authoring/issues/2218))
- Sidebar filters need localising ([#2243](https://github.com/adaptlearning/adapt_authoring/issues/2243))
- Dashboard paging broken after deleting courses ([#2253](https://github.com/adaptlearning/adapt_authoring/issues/2253))
- Reset password appears functional even when SMTP isn't enabled ([#2281](https://github.com/adaptlearning/adapt_authoring/issues/2281))
- Automatic upgrade check broken ([#2290](https://github.com/adaptlearning/adapt_authoring/issues/2290))
- Sorting broken on shared courses dashboard ([#2294](https://github.com/adaptlearning/adapt_authoring/issues/2294))

### Added
- Custom LESS should be validated prior to course build ([#1830](https://github.com/adaptlearning/adapt_authoring/issues/1830))

## [0.7.0] - 2019-03-25

Bundle of UI/usability enhancements.

### Fixed
- CI process should build the app ([#1949](https://github.com/adaptlearning/adapt_authoring/issues/1949))
- Options buttons broken if not in a group ([#1955](https://github.com/adaptlearning/adapt_authoring/issues/1955))
- `masterTenantName` is used instead of `masterTenantDisplayName` on install ([#2004](https://github.com/adaptlearning/adapt_authoring/issues/2004))
- Helpers.hasCoursePermission returns without calling callback on error ([#2113](https://github.com/adaptlearning/adapt_authoring/issues/2113))
- A user's courses are 'orphaned' on user delete ([#2124](https://github.com/adaptlearning/adapt_authoring/issues/2124))
- Removing an asset from a component removes all other instances of that asset ([#2141](https://github.com/adaptlearning/adapt_authoring/issues/2141))
- Child views of backbone-forms' modal are not destroyed ([#2157](https://github.com/adaptlearning/adapt_authoring/issues/2157))
- Ace Editor's syntax colouring is lost when code is uglified ([#2173](https://github.com/adaptlearning/adapt_authoring/issues/2173))
- Course preview page favicon path is incorrect ([#2202](https://github.com/adaptlearning/adapt_authoring/issues/2202))
- Component paste-zone layout broken ([#2214](https://github.com/adaptlearning/adapt_authoring/issues/2214))
- Roles with lesser permissions cannot see any shared courses ([#2266](https://github.com/adaptlearning/adapt_authoring/issues/2266))

### Added
- Menu and page editor should display the course/page title ([#1486](https://github.com/adaptlearning/adapt_authoring/issues/1486))
- Should be able to force a full rebuild of a course ([#1497](https://github.com/adaptlearning/adapt_authoring/issues/1497))
- Add ability to search/filter user list ([#1509](https://github.com/adaptlearning/adapt_authoring/issues/1509))
- Custom CSS box should be resizeable ([#1527](https://github.com/adaptlearning/adapt_authoring/issues/1527))
- Remove requirement for users to install ffmpeg manually ([#1860](https://github.com/adaptlearning/adapt_authoring/issues/1860))
- Add ability to enable framework plugins by default on new courses ([#1875](https://github.com/adaptlearning/adapt_authoring/issues/1875))
- Expose authoring tool version in the HTML ([#1944](https://github.com/adaptlearning/adapt_authoring/issues/1944))
- Should be able to duplicate component list items ([#1961](https://github.com/adaptlearning/adapt_authoring/issues/1961))
- Change your own email via the profile view  ([#2021](https://github.com/adaptlearning/adapt_authoring/issues/2021))
- Add colours to differentiate logger messages ([#2105](https://github.com/adaptlearning/adapt_authoring/issues/2105))
- Share courses with specific users ([#2123](https://github.com/adaptlearning/adapt_authoring/issues/2123))
- Remove MediaElement.js from asset manager previews ([#2170](https://github.com/adaptlearning/adapt_authoring/issues/2170))
- Admins should be able to give new users a name ([#2188](https://github.com/adaptlearning/adapt_authoring/issues/2188))
- Admins should be able to send users a welcome email ([#2189](https://github.com/adaptlearning/adapt_authoring/issues/2189))
- Admins shouldn't be able to change the passwords of users ([#2190](https://github.com/adaptlearning/adapt_authoring/issues/2190))
- Admins should be warned that the reset password button will send an email ([#2191](https://github.com/adaptlearning/adapt_authoring/issues/2191))
- Bundled Underscore is out-of-date ([#2198](https://github.com/adaptlearning/adapt_authoring/issues/2198))

## [0.6.5] - 2019-02-26

Bugfix release.

### Fixed
- Cannot create property 'path' on string 'required' ([#2245](https://github.com/adaptlearning/adapt_authoring/issues/2245))
- Buffer() deprecation warning ([#2247](https://github.com/adaptlearning/adapt_authoring/issues/2247))

## [0.6.4] - 2019-02-18

Bugfix release.

### Fixed
- Plugin globals not always shown in Project settings ([#2223](https://github.com/adaptlearning/adapt_authoring/issues/2223))

## [0.6.3] - 2019-02-14

Bugfix release.

### Upgrade Notes
:skull: Please also upgrade the Adapt framework if your authoring tool is running a version older than 2.0.14. :skull:

### Fixed
- Load in schema from framework clone ([#2177](https://github.com/adaptlearning/adapt_authoring/issues/2177))

## [0.6.2] - 2019-01-23

Bugfix release.

### Fixed
- Gruntfile: `authSource` should be `dbAuthSource` ([#1977](https://github.com/adaptlearning/adapt_authoring/issues/1977))
- Cannot fully import courses with submenus ([#2178](https://github.com/adaptlearning/adapt_authoring/issues/2178))
- Theme settings are lost when selecting same theme ([#2179](https://github.com/adaptlearning/adapt_authoring/issues/2179))

## [0.6.1] - 2018-12-20

Bugfix release primarily to resolve issues introduced in v0.6.0.

### Fixed
- Copy function fails if course has orphaned components ([#1701](https://github.com/adaptlearning/adapt_authoring/issues/1701))
- Preview route is sending invalid status codes ([#1882](https://github.com/adaptlearning/adapt_authoring/issues/1882))
- Can't create a course ContentCollection ([#1953](https://github.com/adaptlearning/adapt_authoring/issues/1953))
- toBoolean not fired for cli arguments ([#2024](https://github.com/adaptlearning/adapt_authoring/issues/2024))
- Deprecation warning when using MongoDB versions 3.2 or above  ([#2053](https://github.com/adaptlearning/adapt_authoring/issues/2053))
- Re-add 'server started' log ([#2063](https://github.com/adaptlearning/adapt_authoring/issues/2063))
- Import of course with SVG asset into AT 0.5.0 seems to yield an error ([#2065](https://github.com/adaptlearning/adapt_authoring/issues/2065))
- No useful error when attempting to preview course with empty children ([#2067](https://github.com/adaptlearning/adapt_authoring/issues/2067))
- Password reset displays error alert on success ([#2075](https://github.com/adaptlearning/adapt_authoring/issues/2075))
- Custom theme/menu settings are not imported ([#2088](https://github.com/adaptlearning/adapt_authoring/issues/2088))
- Formidable limits file uploads to 200mb ([#2095](https://github.com/adaptlearning/adapt_authoring/issues/2095))

### Added
- Standard GitHub API limit too low for install ([#1825](https://github.com/adaptlearning/adapt_authoring/issues/1825))
- Check for compatible node version on start ([#1917](https://github.com/adaptlearning/adapt_authoring/issues/1917))
- Session secret should be auto-generated ([#2007](https://github.com/adaptlearning/adapt_authoring/issues/2007))
- Mailer should verify settings on startup ([#2072](https://github.com/adaptlearning/adapt_authoring/issues/2072))
- Custom LESS should be included on import ([#2108](https://github.com/adaptlearning/adapt_authoring/issues/2108))

## [0.6.0] - 2018-09-25

Release to tidy up the core 'scaffold' code which is used to render the edit forms in the application.

**Main headlines**:
* All editors given a spring clean for readability and code consistency
* Backbone 'overrides' using hard-coded strings have been refactored into Handlebars templates where appropriate
* Switched to Selectize library for tags
* Fields from the properties schema are now properly passed through to Backbone Forms. This includes:
`confirmDelete`, `default`, `editorAttrs`, `editorClass`, `fieldAttrs`, `fieldClass`, `help`, `inputType`, `legend`, `title`, `titleHTML`, `validators`
* Tooltips displaying help text have been added, as well as the underlying attribute name to align with documentation, and to aid troubleshooting
* A reset button has been added to revert a field to its default state
* The custom Question Button editor has been replaced with the standard Text editor out since this was only compatible with version 1 of the framework
* The custom Boolean true/false dropdown has been replaced with the Checkbox editor for consistency. All core plugin schemas have already been switched over
* The undocumented & unused custom `TextArea:blank` editor has been retired

### Added
- Theme and menu settings can now be exposed via the `properties.schema` ([\#1116](https://github.com/adaptlearning/adapt_authoring/issues/1116), [\#1495](https://github.com/adaptlearning/adapt_authoring/issues/1495))

### Changed
- The colour picker widget has been changed to [Spectrum](http://bgrins.github.io/spectrum/) ([\#2014](https://github.com/adaptlearning/adapt_authoring/issues/2014))
- Form fieldset labels are now localised ([\#1376](https://github.com/adaptlearning/adapt_authoring/issues/1376))
- List items can now be rearranged via drag and drop ([\#1430](https://github.com/adaptlearning/adapt_authoring/issues/1430))
- CKEditor's `allowedContent` can now be specified using `ckEditorExtraAllowedContent` in `config.json` to control what's filtered from CK's output ([\#1619](https://github.com/adaptlearning/adapt_authoring/issues/1619))

### Removed
- The `Gruntfile.js` has been tidied up, and any unused code removed ([\#1993](https://github.com/adaptlearning/adapt_authoring/issues/1993))

### Fixed
- A Select input's default value is now configurable via the `properties.schema` ([\#1539](https://github.com/adaptlearning/adapt_authoring/issues/1539))

## [0.5.0] - 2018-06-26

Release which adds the ability to import courses created in the framework, as well as exports from other authoring tool installs.

We're also switching our Node.js support strategy to only include the current **active LTS** release of Node.js, which at time of writing is `v8.x` (see the Node.js [release schedule](https://github.com/nodejs/Release) for more information).

### Upgrade Notes
:skull: If you're using a Node.js version older than `v8.x`, please upgrade prior to installing this version of the authoring tool. :skull:

### Added
- Courses built with the framework and authoring tool exports can now be imported ([\#1387](https://github.com/adaptlearning/adapt_authoring/issues/1387))
- The ability to colour ABC content views in the editor screens ([\#1785](https://github.com/adaptlearning/adapt_authoring/issues/1785))
- The ability to minimise articles in the page editor view ([\#1483](https://github.com/adaptlearning/adapt_authoring/issues/1483))
- Ability to set MongoDB authentication from the install script ([\#1903](https://github.com/adaptlearning/adapt_authoring/issues/1903))
- Support for framework plugins' `pluginDependencies` field, as defined in `bower.json` ([\#1858](https://github.com/adaptlearning/adapt_authoring/issues/1858))
- Support for migration scripts ([#1937](https://github.com/adaptlearning/adapt_authoring/issues/1937))
- Dashboard sorts now persist across sessions, while filters persist for the duration of the current session ([\#1857](https://github.com/adaptlearning/adapt_authoring/issues/1857))
- Instruction to component schema ([\#1712](https://github.com/adaptlearning/adapt_authoring/issues/1712))
- Custom SMTP servers can now be used with mailer ([\#1447](https://github.com/adaptlearning/adapt_authoring/issues/1447))

### Changed
- Bumped archive module dependency version ([\#1930](https://github.com/adaptlearning/adapt_authoring/issues/1930))
- Core front-end modules are now loaded before any front-end plugins ([\#1913](https://github.com/adaptlearning/adapt_authoring/issues/1913))
- `Database#addModel` now catches and logs errors ([\#1855](https://github.com/adaptlearning/adapt_authoring/issues/1855))
- Server now logs more appropriate message if error is caught when loading a route ([\#1853](https://github.com/adaptlearning/adapt_authoring/issues/1853))
- NPM deprecation warnings are now suppressed ([\#1745](https://github.com/adaptlearning/adapt_authoring/issues/1745))
- Only one course export per-user is saved on the server ([\#1056](https://github.com/adaptlearning/adapt_authoring/issues/1056))
- Some mocha test data is now cached after the initial run to reduce runtime ([#1761](https://github.com/adaptlearning/adapt_authoring/issues/1761))

### Removed
- Support for Node.js `v4.x` and `v6.x` ([#1769](https://github.com/adaptlearning/adapt_authoring/issues/1769))
- The need to define third-party front-end plugins in `app.js` ([\#1866](https://github.com/adaptlearning/adapt_authoring/issues/1866))
- Redundant `conf/config_sample.json` file ([\#1793](https://github.com/adaptlearning/adapt_authoring/issues/1793))

### Fixed
- 'Find' feature in Ace editor plugin ([\#1928](https://github.com/adaptlearning/adapt_authoring/issues/1928))
- Issue with `_isVisible` and `_isHidden` not being saved on blocks and components ([\#1888](https://github.com/adaptlearning/adapt_authoring/issues/1888))
- Issue with 'Manage extensions' list ordering ([\#1878](https://github.com/adaptlearning/adapt_authoring/issues/1878))
- Cog menu for pages ([\#1874](https://github.com/adaptlearning/adapt_authoring/issues/1874))
- Upgrade script failure when missing `authoringToolRepository` and `frameworkRepository` from `config.json` ([\#1851](https://github.com/adaptlearning/adapt_authoring/issues/1851))
- Scroll position not persisting in page editor ([\#1814](https://github.com/adaptlearning/adapt_authoring/issues/1814))
- Error thrown when deleting a shared course belonging to another user ([\#1776](https://github.com/adaptlearning/adapt_authoring/issues/1776))

## [0.4.1] - 2018-02-05

This is a patch release fixing issues introduced in v0.4.0.

### Fixed
- Major performance fix for large installs ([\#1758](https://github.com/adaptlearning/adapt_authoring/issues/1758))
- Various minor fixes for install and upgrade scripts ([\#1749](https://github.com/adaptlearning/adapt_authoring/issues/1749), [\#1760](https://github.com/adaptlearning/adapt_authoring/issues/1760), [\#1763](https://github.com/adaptlearning/adapt_authoring/issues/1763), [\#1797](https://github.com/adaptlearning/adapt_authoring/issues/1797), [\#1838](https://github.com/adaptlearning/adapt_authoring/issues/1838), [\#1842](https://github.com/adaptlearning/adapt_authoring/issues/1842))
- Dashboard paging fixed ([\#1759](https://github.com/adaptlearning/adapt_authoring/issues/1759))
- Asset management paging fixed ([\#1790](https://github.com/adaptlearning/adapt_authoring/issues/1790))
- Fixed issue whereby the page editor screen would occasionally render the same block twice ([\#1834](https://github.com/adaptlearning/adapt_authoring/issues/1834))
- Asset preview image has been fixed for contrib-media video assets ([\#1835](https://github.com/adaptlearning/adapt_authoring/issues/1835))
- Fixed menu editor rendering quirks ([\#1837](https://github.com/adaptlearning/adapt_authoring/issues/1837))

## [0.4.0] - 2017-10-17

Major refactor of the front-end application.

### Upgrade Notes
Due to the changes made to the install script, this release restricts the installed framework version to `v2.x.x` to avoid unsupported breaking changes introduced in framework `v3`.

There are a few notable changes to the code that may impact customisations:
- `app:dataReady` has been renamed to `origin:dataReady`
- `variables.less` has been renamed to `colours.less`.
- Some editor collections have been renamed:
    - `componentTypes` -> `componenttypes`
    - `extensionTypes` -> `extensiontypes`
    - `courseAssets` -> `courseassets`

Please check the release notes below for more information.

### Added
- Framework themes can now display a preview in the theme picker. To enable this, a `preview.jpg` file is needed in the theme folder root
- Can now specify custom auth source for MongoDB ([\#1673](https://github.com/adaptlearning/adapt_authoring/issues/1673))
- New `contentPane` module takes over view rendering from `Router`, and acts as a consistent container for main app content. Makes sure scrolling is consistent across the application among other things.
- EditorDataLoader has been added to preload editor data. You can use the `EditorDataLoader.waitForLoad` function to halt code until preload has finished. You can also use the `editor:dataPreloaded` event.

### Changed
- Major refactoring of the frontend folder:
    - 'Core' code separated into modules, and core
    - Web-app loading rewritten
    - Core LESS files are now accessible without needing to specify a relative file path. `variables.less` has been renamed to `colours.less`.
    - All duplicate LESS files have been merged, and put in their respective module folder
    - The `adaptbuilder` folder has been renamed to `build`
    - Editor routing code has been simplified, and moved into the sub-module folders. See [modules/editor/index.js#L27-L55](https://github.com/adaptlearning/adapt_authoring/blob/v0.4.0/frontend/src/modules/editor/index.js#L27-L55) for the routing code, and [modules/editor/article/index.js#L10](https://github.com/adaptlearning/adapt_authoring/blob/release-0.4.0/frontend/src/modules/editor/article/index.js#L10) as an example of the new routing method.
    - Events using `app:` replaced with `origin:` for consistency. Most notably: any code using `app:dataReady` will need to be switched over to listen to `origin:dataReady`
    - Router has been refactored, and the following convenience functions added: `navigateTo` - wrapper for `Backbone.Router.navigate`, `navigateToLogin`, `setHomeRoute` and `navigateToHome`
    - Editor collections have been renamed to reflect the MongoDB collection names: `editor.componentTypes` -> `editor.componenttypes`, `editor.extensionTypes` -> `editor.extensiontypes`, `editor.courseAssets` -> `editor.courseassets`
    - `window.polyglot` has been abstracted into the new localisation module, which can be referenced with `Origin.l10n`
- Dashboard module has been renamed to projects, and is the default home route
- User management has moved from plugins to modules
- Install/upgrade scripts overhauled:
    - Can now upgrade the server and framework to specific releases
    - Can now upgrade the server and framework separately
    - Install/upgrade scripts have been made prettier to look at (and more useful) with the introduction of activity spinners, and more helpful log messages
    - Upgrade script now ignores draft and prereleases ([\#1723](https://github.com/adaptlearning/adapt_authoring/issues/1723))
    - Upgrade/install script now allows custom git repositories to be used for both the server and framework source
    - Framework version can be restricted so as not to automatically upgrade to a version you don't want to support. To enable this, specify the `framework` version in `package.json` (accepts any valid semver range) ([\#1703](https://github.com/adaptlearning/adapt_authoring/issues/1703))
- Besides the schemas, the user interface is now completely localised ([\#1573](https://github.com/adaptlearning/adapt_authoring/issues/1573))
- Improved multi-user support for previewing/publishing of courses ([\#1220](https://github.com/adaptlearning/adapt_authoring/issues/1220))
- User profile page is now correctly styled ([\#1413](https://github.com/adaptlearning/adapt_authoring/issues/1413))
- Newly created courses can now be built without any editing ([\#1678](https://github.com/adaptlearning/adapt_authoring/issues/1678))
- Must now input super admin password twice during install to avoid user error ([\#1032][https://github.com/adaptlearning/adapt_authoring/issues/1032])
- Abstracted polyglot into the new internal `l10n` library (accessible globally via the `Origin` object). Language strings are now obtained using `Origin.l10n.t`
- Backbone forms version updated, and override code tidied up/removed where possible
- Boolean selects are now rendered as checkboxes.

### Removed
- **Vagrant support has been dropped** ([\#1503](https://github.com/adaptlearning/adapt_authoring/issues/1503))
- The user management's user list sort is now case-insensitive ([\#1549](https://github.com/adaptlearning/adapt_authoring/issues/1549))
- Front-end tests removed for now

### Fixed
- Framework plugin update has been fixed ([\#1415](https://github.com/adaptlearning/adapt_authoring/issues/1415))
- Unused user password reset data is now cleared on delete of the related user ([\#1553](https://github.com/adaptlearning/adapt_authoring/issues/1553))
- Copy and paste now correctly includes any extension settings ([\#1484](https://github.com/adaptlearning/adapt_authoring/issues/1484))
- Dashboard no longer hangs if large images have been used as hero images ([\#1470](https://github.com/adaptlearning/adapt_authoring/issues/1470))
- Server plugin schemas now correctly reflect the latest state after a plugin has been updated (previously a server restart was needed for any schema changes to be reflected) ([\#1524](https://github.com/adaptlearning/adapt_authoring/issues/1524))
- Preview loading route added to prevent preview opening in a background tab/window ([\#1636](https://github.com/adaptlearning/adapt_authoring/issues/1636))
- We now only attempt to load valid routes, avoiding unnecessary server breakdowns ([\#1534](https://github.com/adaptlearning/adapt_authoring/issues/1534))
- Mocha tests fixed, and integrated with TravisCI
- Dragging is now restricted for components depending on layout ([\#1631](https://github.com/adaptlearning/adapt_authoring/issues/1631))

## [0.3.0] - 2017-01-24

User management feature release.

### Added
- User management
  - Can add users
  - Can edit existing users (email, password, tenant, role, unlock locked accounts)
  - Can disable/restore users
  - Can delete users
- Add option to disable automatic switching-on of accessibility on touch devices
- Mailer now supports HTML templated emails
- User's roles now displayed on their profile page

### Changed
- Asset description is no longer a required field
- Updated config.json with up-to-date values
- Permissions page styled to match UI refresh
- Travis CI configuration updated:
  - Added Node.js version 4, 5 and 6
  - git, mongodb and adapt versions logged to console
  - Removed caching for `node_modules` directory
  - Removed `on_start` from notifications as Travis WebLint shows as deprecated

### Fixed
- Block alignment in page editor
- Password reset emails now work as intended
- The 'enabled' checkbox in Plugin Management now hides plugins from editor
- Removed tab/newline chars from CKEditor output to fix tabbing in published courses
- Menu picker selected colouring
- Notify content is now scrollable, rather than being rendered off screen

## [0.2.2] - 2016-09-13

Bugfix release.

### Added
- Support for editing JSON objects, for example, the `_playerOptions` array in the Media component

### Fixed
- Vagrant issue with preventing updating plugins

## [0.2.1] - 2016-08-16

Bugfix release after community user testing.

### Added
- LESS sourcemaps

### Fixed
- Block drop-zone padding
- Export button now hidden again for all non-admin users
- Auto-scrolling while dragging on menu editor and page editor screens
- Styling of scaffold list items
- LESS imports now working
- reset.less now loaded before *everything*

## [0.2.0] - 2016-07-27

Major theme update to match the new look and feel of [adaptlearning.org](www.adaptlearning.org).

### Changed
- Disabled SSL certificate check during Vagrant install

### Fixed
- Caching issue related to course schemas
- Tag autocomplete mechanism sometimes throws 500 error
- Form validation
- Saving course settings hangs if nothing has been changed  

## [0.1.7] - 2016-04-28

Bugfix release to support framework v2.0.9.

### Added
- Support for new Adapt Framework 'menu locking' functionality
- Support for v2.0.9 of the Adapt Framework
- Support for `_isAvailable` flag
- Added link to GitHub repositories for plugins

### Changed
- Extended `<legend>` styles to arrays
- Improved database connection caching
- Updated code to respect property order in schema files

### Fixed
- Role statements not updated on a server restart
- Autocomplete enabled on text input fields
- MongoStore does not support `replicasets`
- Removed `@learningpool.com` e-mail address hack

## [0.1.6] - 2016-03-29

Release to add source-code export of courses.

### Added
- Support for new Adapt Framework 'start page' functionality
- Ability to export source code including plugins enabled for a course
- Support for v2.0.8 of the Adapt Framework
- Support for Google Analytics
- Support for custom plugins in the plugins folder
- Trigger for enabling extensions
- Added support for Node.js v4.3.x LTS.

### Changed
- Support for Font Awesome 4.5.0

### Fixed
- Export doesn't auto download in Firefox
- Vagrant setup on windows processes.json not found
- Preview fails running vagrant on windows
- Unable to delete blocks after copy and paste
- Intermittent error in copy and pasting component

## [0.1.5] - 2016-02-16

Bugfix release to support framework v2.0.7.

### Added
- Support for v2.0.7 of the Adapt Framework
- Optimised build process, i.e. only plugins used are bundled
- Ability to copy the `_id` value of `contentobjects`, `articles`, `blocks` and `components` to clipboard
- Ability to easily change component layouts without using drag and drop
- Ability to export the source code of a particular course
- Caching added to assets to improve performance

### Changed
- `_isAvailableInEditor` flag persisted when a new plugin is uploaded
- Optimised performance of processing course assets in preview/download
- Preview redirects to index.html rather than main.html
- The count of failed logins is reset after a successful login
- Turned off automatic population of display title for blocks

### Fixed
- Non-essential attributes removed from `course.json`
- ACE JavaScript error when creating a new course
- Hard 100kb limit on JSON payload
- Corrected Project Details save issue

## [0.1.4] - 2015-11-25

Release to add support for Node.js v4.2.2 LTS.

### Added
- Support for Node.js v4.2.2 LTS
- Support for generating JavaScript source maps on preview or download (via Configuration Settings)
- Support for Vagrant
- Support for JSCS

### Changed
- Locking the Title and Display Title by default
- Renamed 'Publish' button to 'Download'
- Updated package dependencies to correct security issues
- Assets can now be defined in `articles.json`
- Tag length has been increased to 30 characters

### Fixed
- Error on copying and pasting a block
- Custom CSS/LESS not pulling through
- `_supportedLayout` not working correctly

## [0.1.3] - 2015-10-21

Bugfix release.

### Added
- Support for MongoDB `replicasets`
- More robust processing for missing schema pluginLocations
- Support for `_accessibility` added to Configuration Settings
- Support for screen breakpoints added to Configuration Settings
- Added security to preview route

### Changed
- Standardised notifications and implemented SweetAlert library
- Bumped CKEditor version to 4.5.4

### Fixed
- Page and menu/sections were created without a `linkText` property set
- IE9 issue with editor and list formatting
- Problem with `isAssetExternal()`
- Dashboard problems when a hero image is not set
- Added validation for length of database name
- Added validation to Configuration Settings

## [0.1.2] - 2015-09-30

Bugfix release.

### Added
- Support for `_isOptional` (Adapt Framework v2.x)
- Support for accessibility (Adapt Framework v2.x)
- Support for plugin 'globals' (Adapt Framework v2.x)
- Improved install/upgrade
- 'Global' configurations for plugins are conditionally applied
- Added basic browser-based spell-check to HTML editor
- Table editing is now an option on the HTML editor
- Any `<span>` tag added in the HTML editor is now preserved
- Support for 'Autofill' on graphic components
- Confirmation when deleting a component/extension item, such as a narrative or question stem
- Ability to delete assets
- Support for Adapt Framework v2.x assessment extension

### Changed
- Course now has a Display Title property
- Default plugins are now taken from the framework `adapt.json` file, hard-coded references to plugins are
- Removed the dependency on adapt-cli
- Added better logging for Validation Failed errors on database operations
- Remove hard-coded references to core plugins
- Upgrade to Express 4, support NodeJS 0.12.6 (removed hard dependency on 0.10.33)
- Any `logger.log()` calls now support placeholders properly
- Authoring tool specific properties now removed from output JSON
- Updated logo

### Fixed
- Course tags lost when a hero image is added or removed
- Broken preview and publish after deleting asset
- Tutor extension breaks configuration screen
- Asset collection not displaying results when a small number of records should have been retrieved
- Component type label gets lost on plugin upgrade
- 500 error when updating plugins with framework v1.1.5
- Resource link save errors
- Assets on moved components hold reference to previous block
- When ffmpeg is not installed, the thumbnailPath 'none' causes issues with routers
- Deleting an article or page does not remove associated assets contained with in
- Modal overlay has a few responsive issues when appending content/custom editing views
- Issue with long list item attribute values going outside of the list item box
- Issue with nested items in backbone forms showing as `[object Object]`
- Course tags were removed when a hero image was added or removed



## [0.1.1] - 2015-03-12

Large bugfix release.

## Upgrade Notes
If upgrading from a previous version, please add the following keys to your config.json
- `outputPlugin` -> `adapt`
- `masterTenantName` -> {name of the folder containing your master tenant files}
- `masterTenantID` - {MongoDB `_id` of the initial first row in the `tenants` collection}

### Added
- Support for client-side configs
- Proper support for shared courses
- Poster images now available on courses
- Progress indicator on preview
- Support for `_trackingId` values

### Changed
- Role permissions synced on a server restart
- Re-factoring of build process
- Install process updated

### Fixed
- Minor IE9 fixes
- Corrected 'Back to courses' button
- Missing language strings
- Fixes around drag and drop, copy and paste
- Asset manager filters
- General UI fixes
- Fixes with theme and menu selection to persist selection after new versions are installed
- Various context menu issues


## [0.1.0] - 2015-01-26

Initial release.

### Added
- Support for menu selection
- Support to load configuration from process.env
- Support for nested properties in component schemas
- Tag autocompletion
- Added indicator to feedback on saving status
- Added "Remember Me" functionality
- Asset upload from within asset manager
- Progressive loading of assets
- Progressive loading of dashboard
- Now storing first and last login for user

### Changed
- Replaced editor with CKEditor
- Improved performance with policy files and permissions
- Clear permission cache on role adjustment
- Switched to cli installer
- Made the dashboard pluggable
- Copy/paste moved to server-side
- Content plugins preloaded on server boot
- Asset records now use relative paths

### Removed
- iframe previews
- Sockets.io (for now...)

### Fixed
- Issue with tags input in IE9
- Issue where project settings caused a javascript error
- Issue with uploading gifs would fail
- Issues with course duplication
- Issues with `bowercache` file locking
- Issues with drag and drop in page editor
- Loading screen of death
- Session cookie security issues

[0.10.3]: https://github.com/adaptlearning/adapt_authoring/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/adaptlearning/adapt_authoring/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.6.5...v0.7.0
[0.6.5]: https://github.com/adaptlearning/adapt_authoring/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/adaptlearning/adapt_authoring/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/adaptlearning/adapt_authoring/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/adaptlearning/adapt_authoring/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/adaptlearning/adapt_authoring/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/adaptlearning/adapt_authoring/tree/v0.1.0
