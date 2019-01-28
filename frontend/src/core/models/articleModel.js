// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ArticleModel = ContentModel.extend({
    urlRoot: '/api/content/article',
    _parentType: 'contentobject',
    _siblingTypes: 'article',
    _childTypes: 'block',

    defaults: {
      _isCollapsible: true,
      _isCollapsed: false
    }

  });

  return ArticleModel;
});
