// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorExtensionsEditView = require('./views/editorExtensionsEditView');

  Origin.on('editor:extensions', function(data) {
    Origin.sidebar.update({ backButton: { label: "Back to course" } });
    Origin.contentPane.setView(EditorExtensionsEditView, { model: new Backbone.Model({ _id: Origin.location.route1 }) });
  });
});
