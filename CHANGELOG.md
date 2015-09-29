# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased][unreleased]
### Changed

## [0.1.2] - 2015-09-30
### Added
- Adapt v2.0: Add support for _isOptional
- Adapt v2.0 - Add support for accessibility
- Adapt v2.0 - Make Publish/Preview with new framework Gruntfile
- Adapt v2.0 - Update templates, views and models for new attributes
- Automatically run 'npm install' and 'grunt build' from the upgrade
- Add support for table editing
- 'Global' configs for plugins should be conditionally applied
- Support plugin globals

### Changed
- Bump 'winston' references
- Update login logo
- CK editor does not have spell check
- Refactor: Make the install routine install the default plugins from the framework
- add better logging for Validation Failed errors on database operations
- Remove hard-coded references to core plugins
- Upgrade to Express 4, support NodeJS 0.12.6
- Confirmation when deleting an item such as a narrative item or question stem

### Fixed

- Bug: Course tags lost when a hero image is added or removed
- Broken preview and publish after deleting asset
- Bug: Unable to update Tutor plugin
- Handlebars.helpers.isAssetExternal: bad scope reference
- Bug: Tutor extension breaks configuration screen
- Course now requires a field for Display Title
- Issue with asset collection view being searched and a small amount of items returning
- Bug: Component type label gets lost on plugin upgrade
- 500 error when updating plugins with framework v1.1.5
- Resource link save errors
- Bug: Assets on moved components hold reference to previous block
- Bug: When ffmpeg is not installed, the thumbnailPath 'none' causes issues with routers
- Bug: Deleting an article or page does not remove associated assets contained with in
- Placeholder issue with logger.log() calls
- Extension editing broken in develop branch?
- Modal overlay has a few responsive issues when appending content/custom editing views
- Issue with long list item attribute values going outside of the list item box
- Issue with nested items in backbone forms showing as [object Object]
- Sanitise builder specific properties from output JSON
- Any <span> tag added in the wysiwyg editor is removed when going in to re-edit


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
