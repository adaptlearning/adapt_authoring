// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorData = require('../global/editorDataLoader');
  var Helpers = require('../global/helpers');

  var BlockModel = require('core/models/blockModel');
  var EditorBlockEditView = require('./views/editorBlockEditView');
  var EditorBlockEditSidebarView = require('./views/editorBlockEditSidebarView');

  Origin.on('editor:block', function(data) {
    if(data.action !== 'edit') {
      return;
    }
    (new BlockModel({ _id: data.id })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        Helpers.setPageTitle(model, true);
        Origin.sidebar.addView(new EditorBlockEditSidebarView({ model: model, form: form }).$el);
        Origin.contentPane.setView(EditorBlockEditView, { model: model, form: form });
      }
    });
  });
});
