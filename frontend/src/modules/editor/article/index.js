// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Helpers = require('../global/helpers');

  var ArticleModel = require('core/models/articleModel');
  var EditorArticleEditSidebarView = require('./views/editorArticleEditSidebarView');
  var EditorArticleEditView = require('./views/editorArticleEditView');

  Origin.on('editor:article', function(data) {
    if(data.action !== 'edit') {
      return;
    }
    (new ArticleModel({ _id: data.id })).fetch({
      success: function(model) {
        // ESDC - added template level to model data
        var form = Origin.scaffold.buildForm({ model: model, level: 'article' }); 
        Helpers.setPageTitle(model);
        Origin.sidebar.addView(new EditorArticleEditSidebarView({ model: model, form: form }).$el);
        Origin.contentPane.setView(EditorArticleEditView, { model: model, form: form });
      }
    });
  });
});
