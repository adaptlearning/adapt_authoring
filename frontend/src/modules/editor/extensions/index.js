// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var EditorExtensionsEditView = require('./views/editorExtensionsEditView');
  var EditorExtensionsEditSidebarView = require('./views/editorExtensionsEditSidebarView');

  Origin.on('editor:extensions', function(data) {
    Origin.trigger('location:title:update', { title: 'Manage extensions' });
    var route1 = Origin.location.route1;
    // Check whether the user came from the page editor or menu editor
    var backButtonRoute = "/#/editor/" + route1 + "/menu";
    var backButtonText = "Back to menu";
    if (Origin.previousLocation.route2 === "page") {
      backButtonRoute = "/#/editor/" + route1 + "/page/" + Origin.previousLocation.route3;
      backButtonText = "Back to page";
    }
    Origin.sidebar.addView(new EditorExtensionsEditSidebarView().$el, {
      "backButtonText": backButtonText,
      "backButtonRoute": backButtonRoute
    });
    Origin.contentPane.setView(EditorExtensionsEditView, { model: new Backbone.Model({ _id: route1 }) });
  });
});
