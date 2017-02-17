// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var ConfigModel = require('core/models/configModel');
  var EditorConfigEditView = require('./views/editorConfigEditView');
  var EditorConfigEditSidebarView = require('./views/editorConfigEditSidebarView');
  var Helpers = require('../global/helpers');

  Origin.on('editor:config', function(data) {
    (new ConfigModel({ _courseId: Origin.location.route1 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        Helpers.setPageTitle(model);
        Origin.sidebar.addView(new EditorConfigEditSidebarView({ form: form }).$el);
        Origin.contentPane.setView(EditorConfigEditView, { model: model, form: form });
      }
    });
  });
});
