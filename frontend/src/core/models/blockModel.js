// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var BlockModel = ContentModel.extend({
    urlRoot: '/api/content/block',
    _parentType: 'article',
    _siblingTypes: 'block',
    _childTypes: 'component',
    // Block specific properties
    layoutOptions:  null,
    dragLayoutOptions: null,
    // These are the only attributes which should be permitted on a save
    // TODO look into this...
    whitelistAttributes: [
      '_id',
      '_courseId',
      '_parentId',
      '_layoutOptions',
      '_type',
      '_sortOrder',
      '_classes',
      '_isOptional',
      '_isAvailable',
      'body',
      'displayTitle',
      'title',
      '_extensions',
      'themeSettings',
      '_onScreen',
      '_isVisible',
      '_isHidden',
      '_colorLabel'
    ]
  });

  return BlockModel;
});
