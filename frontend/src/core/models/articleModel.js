// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ArticleModel = ContentModel.extend({
    urlRoot: '/api/content/article',
    _parent: 'contentObjects',
    _siblings: 'articles',
    _children: 'blocks',

    defaults: {
      _isCollapsed: false
    }

  });

  return ArticleModel;
});
