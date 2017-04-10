// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/app/origin');
  var EditorData = require('../global/editorDataLoader');
  var Helpers = require('../global/helpers');

  var BlockModel = require('core/app/models/blockModel');
  var EditorBlockEditView = require('./views/editorBlockEditView');
  var EditorBlockEditSidebarView = require('./views/editorBlockEditSidebarView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      if(route2 === 'block' && route4 === 'edit') {
        (new BlockModel({ _id: route3 })).fetch({
          success: function(model) {
            var form = Origin.scaffold.buildForm({ model: model });
            Helpers.setPageTitle(model);
            Origin.sidebar.addView(new EditorBlockEditSidebarView({ model: model, form: form }).$el);
            Origin.contentPane.setView(EditorBlockEditView, { model: model, form: form });
          }
        });
      }
    });
  });
});
