# Change Log

All notable changes to the Adapt authoring tool are documented in this file.

**IMPORTANT**: For information on how to **correctly and safely** update your installation, please consult **INSTALL.md**.

_Note that we adhere to the [semantic versioning](http://semver.org/) scheme for release numbering._

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
