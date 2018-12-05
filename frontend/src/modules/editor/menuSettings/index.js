// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('../global/editorDataLoader');
  var ConfigModel = require('core/models/configModel');
  var EditorMenuSettingsEditView = require('./views/editorMenuSettingsEditView');
  var Helpers = require('../global/helpers');

  Origin.on('editor:menusettings', function(data) {
    var route1 = Origin.location.route1;
    (new ConfigModel({ _courseId: route1 })).fetch({
      success: function(model) {
        Helpers.setContentSidebar();
        Origin.contentPane.setView(EditorMenuSettingsEditView, { model: model });
      }
    });
  });
});
