// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ConfigModel = require('core/models/configModel');
  var EditorConfigEditView = require('./views/editorConfigEditView');
  var Helpers = require('../global/helpers');

  Origin.on('editor:config', function(data) {
    (new ConfigModel({ _courseId: Origin.location.route1 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        Origin.trigger('location:title:update', { title: Origin.l10n.t('app.editorconfig') });
        Helpers.setContentSidebar({ fieldsets: form.fieldsets });
        Origin.contentPane.setView(EditorConfigEditView, { model: model, form: form });
      }
    });
  });
});
