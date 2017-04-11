// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Helpers = require('../global/helpers');

  var ConfigModel = require('core/models/configModel');
  var EditorConfigEditView = require('./views/editorConfigEditView');
  var EditorConfigEditSidebarView = require('./views/editorConfigEditSidebarView');

  Origin.on('editor:config', function(data) {
    (new ConfigModel({ _courseId: Origin.location.route1 })).fetch({
      success: function(model) {
        Helpers.setPageTitle(model);
        var form = Origin.scaffold.buildForm({ model: model });
        Origin.sidebar.addView(new EditorConfigEditSidebarView({ form: form }).$el);
        Origin.contentPane.setView(EditorConfigEditView, { model: model, form: form });
      }
    });
  });
});
