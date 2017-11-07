// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ArticleModel = ContentModel.extend({
    urlRoot: '/api/content/article',
    _parent: 'contentObjects',
    _siblingTypes: 'articles',
    _childTypes: 'blocks'
  });

  return ArticleModel;
});
