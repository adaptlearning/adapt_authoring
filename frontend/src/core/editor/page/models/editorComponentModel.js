// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var EditorModel = require('editorGlobal/models/editorModel');

  var EditorComponentModel = EditorModel.extend({
    urlRoot: '/api/content/component',
    _parent: 'blocks',
    _siblings:'components',
    _children: false,
    // These are the only attributes which should be permitted on a save
    // TODO seems hacky
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
      'themeSettings'
    ],

    initialize: function() {},
  });

  return EditorComponentModel;
});
