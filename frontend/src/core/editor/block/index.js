// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var Helpers = require('../global/helpers');

  var EditorBlockEditView = require('./views/editorBlockEditView');
  var EditorBlockEditSidebarView = require('./views/editorBlockEditSidebarView');
  var EditorBlockModel = require('./models/editorBlockModel');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    if(route2 !== 'block' || route4 !== 'edit') {
      return;
    }
    (new EditorBlockModel({ _id: route3 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        Origin.trigger('location:title:update', { title: 'Editing block - ' + model.get('title') });
        Origin.sidebar.addView(new EditorBlockEditSidebarView({ model: model, form: form }).$el);
        Origin.contentPane.setView(EditorBlockEditView, { model: model, form: form });
      }
    });
  });
});
