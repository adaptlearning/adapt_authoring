# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).


## [0.1.4] - 2015-11-25
This version adds support for Node.js v4.2.2 LTS.  

IMPORTANT: If upgrading from a previous installation, first remove the `node_modules` folder and run
```javascript 
npm install --production
```
 to install the latest code dependencies, then run
```javascript 
node upgrade
``` 
 to get the latest authoring tool and framework changes.

### Added
- Support for Node.js v4.2.2 LTS
- Support for generating JavaScript source maps on preview or download (via Configuration Settings)
- Support for Vagrant
- Support for JSCS

### Changed
- Locking the Title and Display Title by default
- Renamed 'Publish' button to 'Download'
- Updated package dependencies to correct security issues
- Assets can now be defined in articles.json
- Tag length has been increased to 30 characters

### Fixed
- Bug: Error on copying and pasting a block
- Bug: Custom CSS/LESS not pulling through
- Bug: _supportedLayout not working correctly

## [0.1.3] - 2015-10-21

### Added
- Support for MongoDB replicasets
- More robust processing for missing schema pluginLocations
- Support for _accessibility added to Configuration Settings
- Support for screen breakpoints added to Configuration Settings
- Added security to preview route

### Changed
- Standardised notifications and implemented SweetAlert library
- Bumped CKEditor version to 4.5.4

### Fixed
- Bug: Page and menu/sections were created without a linkText property set
- Bug: IE 9 issue with editor and list formatting
- Bug: Problem with isAssetExternal()
- Bug: Dashboard problems when a hero image is not set
- Bug: Added validation for length of database name
- Bug: Added validation to Confugration Settings 

## [0.1.2] - 2015-09-30
IMPORTANT: If upgrading from a previous installation, first remove the node_modules folder and run
```javascript 
npm install --production
```
 to install the latest code dependencies, then run
```javascript 
node upgrade
``` 
 to get the latest authoring tool and framework changes.

### Added
- Support for _isOptional (Adapt Framework v2.x)
- Support for accessibility (Adapt Framework v2.x)
- Support for plugin 'globals' (Adapt Framework v2.x)
- Improved install/upgrade
- 'Global' configurations for plugins are conditionally applied
- Added basic browser-based spell-check to HTML editor
- Table editing is now an option on the HTML editor
- Any <span> tag added in the HTML editor is now preserved
- Support for 'Autofill' on graphic components
- Confirmation when deleting a component/extension item, such as a narrative or question stem
- Ability to delete assets
- Support for Adapt Framework v2.x assessment extension

### Changed
- Course now has a Display Title property
- Default plugins are now taken from the framework adapt.json file, hard-coded references to plugins are 
- Removed the dependency on adapt-cli
- Added better logging for Validation Failed errors on database operations
- Remove hard-coded references to core plugins
- Upgrade to Express 4, support NodeJS 0.12.6, i.e. removed hard dependency on 0.10.33
- Any logger.log() calls now support placeholders properly
- Authoring tool specific properties now removed from output JSON
- Updated logo


### Fixed

- Bug: Course tags lost when a hero image is added or removed
- Bug: Broken preview and publish after deleting asset
- Bug: Tutor extension breaks configuration screen
- Bug: Asset collection not displaying results when a small number of records should have been retrieved
- Bug: Component type label gets lost on plugin upgrade
- Bug: 500 error when updating plugins with framework v1.1.5
- Bug: Resource link save errors
- Bug: Assets on moved components hold reference to previous block
- Bug: When ffmpeg is not installed, the thumbnailPath 'none' causes issues with routers
- Bug: Deleting an article or page does not remove associated assets contained with in
- Bug: Modal overlay has a few responsive issues when appending content/custom editing views
- Bug: Issue with long list item attribute values going outside of the list item box
- Bug: Issue with nested items in backbone forms showing as [object Object]
- Bug: Course tags were removed when a hero image was added or removed



## [0.1.1] - 2015-03-12 Brian Quinn <brian@learningpool.com>

IMPORTANT: If upgrading from a previous version, please add the following keys to your config.json
- "outputPlugin" - "adapt"
- "masterTenantName" - {name of the folder containing your master tenant files}
- "masterTenantID" - {MongoDB _id of the initial first row in the 'tenants' collection}

Changes below come from submissions by several developers:

  Brian Quinn <brian@learningpool.com>
  Daryl Hedley <darylhedley@hotmail.com>
  Dennis Heaney <dennis@learningpool.com>
  Finbar Tracey <finbar@learningpool.com>

- Minor IE 9 fixes
- Added support for client-side configs
- Corrected 'Back to courses' button
- Added missing language strings
- Fixes around drag and drop, copy and paste
- Role permissions synced on a server restart
- Fix for asset manager filters
- General UI fixes
- Proper support for shared courses
- Poster images now available on courses
- Progress indicator on preview
- Re-factoring of build process
- Fixes with theme and menu selection to persist selection after new versions are installed
- Added support for _trackingId values
- Install updated
- Context menu issues fixed

## [0.1.0] - 2015-01-26 Dennis Heaney <dennis@learningpool.com>

Changes below come from submissions by several developers:

  Brian Quinn <brian@learningpool.com>
  Daryl Hedley <darylhedley@hotmail.com>
  Dennis Heaney <dennis@learningpool.com>
  Finbar Tracey <finbar@learningpool.com>

 - replaced editor with CKEditor
 - fixed issue with tags input in IE9
 - fixed issue where project settings caused a javascript error
 - improved performance with policy files and permissions
 - clear permission cache on role adjustment
 - switched to cli installer
 - support for menu selection
 - fixed issue with uploading gifs would fail
 - fixed issues with course duplication
 - fixed issues with bowercache file locking
 - added support to load configuration from process.env
 - added support for nested properties in component schemas
 - added tag autocompletion
 - made the dashboard pluggable
 - added indicator to feedback on saving status
 - fixed issues with drag and drop in page editor
 - added "Remember Me" functionality
 - can upload asset from within asset manager
 - progressive loading of assets
 - progressive loading of dashboard
 - fixed the loading screen of death
 - now storing first and last login for user
 - copy/paste moved to server-side
 - removed sockets.io for now
 - preloading content plugins on server boot
 - fixed session cookie security issues
 - asset records now use relative paths
 - removed iframe previews

[unreleased]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/adaptlearning/adapt_authoring/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/adaptlearning/adapt_authoring/tree/v0.1.0


