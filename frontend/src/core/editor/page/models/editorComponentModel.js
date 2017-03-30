// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorComponentModel = EditorModel.extend({
    urlRoot: '/api/content/component',
    _parent: 'blocks',
    _siblings: 'components',
    _children: false,
    // These are the only attributes which should be permitted on a save
    // TODO look into this...
    whitelistAttributes: [
      '_id',
      '_componentType',
      '_courseId',
      '_layout',
      '_parentId',
      '_type',
      'properties',
      '_component',
      '_extensions',
      '_classes',
      '_isOptional',
      '_isAvailable',
      'body',
      'displayTitle',
      'title',
      'version',
      'themeSettings',
      '_onScreen'
    ],

    initialize: function() {
      // TODO intentional override?
    }
  });
});
