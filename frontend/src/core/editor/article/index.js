// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var Helpers = require('../global/helpers');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    if (route2 !== 'article' || route4 !== 'edit') {
      return;
    }
    (new EditorArticleModel({ _id: route3 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        Origin.trigger('location:title:update', { title: 'Editing article - ' + model.get('title') });
        Origin.sidebar.addView(new EditorArticleEditSidebarView({ model: model, form: form }).$el);
        Origin.contentPane.setView(EditorArticleEditView, { model: model, form: form });
      }
    });
  });
});
