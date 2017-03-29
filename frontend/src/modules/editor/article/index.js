// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('../global/editorDataLoader');
  var Helpers = require('../global/helpers');

  var ArticleModel = require('core/models/articleModel');
  var EditorArticleEditSidebarView = require('./views/editorArticleEditSidebarView');
  var EditorArticleEditView = require('./views/editorArticleEditView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      if(route2 === 'article' && route4 === 'edit') {
        (new ArticleModel({ _id: route3 })).fetch({
          success: function(model) {
            var form = Origin.scaffold.buildForm({ model: model });
            Helpers.setPageTitle(model);
            Origin.sidebar.addView(new EditorArticleEditSidebarView({ model: model, form: form }).$el);
            Origin.contentPane.setView(EditorArticleEditView, { model: model, form: form });
          }
        });
      }
    });
  });
});
