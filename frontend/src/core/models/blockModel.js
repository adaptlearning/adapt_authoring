// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var BlockModel = ContentModel.extend({
    urlRoot: 'api/content/block',
    _parentType: 'article',
    _siblingTypes: 'block',
    _childTypes: 'component',
    // Block specific properties
    layoutOptions:  null,
    dragLayoutOptions: null,
    attributeBlacklist: [
      '_isDeleted',
      '_tenantId',
      '_trackingId',
      'createdBy',
      'createdAt',
      'layoutOptions',
      'updatedAt'
    ]
  });

  return BlockModel;
});
