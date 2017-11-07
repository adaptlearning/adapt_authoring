// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentModel = require('./contentModel');

  var ContentObjectModel = ContentModel.extend({
    urlRoot: '/api/content/contentobject',
    _parent: 'contentObjects',
    _siblingTypes: 'contentObjects',
    _childTypes: ['contentObjects', 'articles'],

    defaults: {
      _isSelected: false,
      _isExpanded: false
    }
  });

  return ContentObjectModel;
});
