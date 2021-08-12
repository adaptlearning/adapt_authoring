// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ComponentModel = ContentModel.extend({
    urlRoot: 'api/content/component',
    _parentType: 'block',
    _siblingTypes: 'component',
    attributeBlacklist: [
      '_isDeleted',
      'createdBy',
      'createdAt',
      'updatedAt'
    ]
  });

  return ComponentModel;
});
