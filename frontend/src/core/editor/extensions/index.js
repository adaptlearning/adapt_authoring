// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorData = require('../global/editorDataLoader');

  var EditorExtensionsEditView = require('./views/editorExtensionsEditView');
  var EditorExtensionsEditSidebarView = require('./views/editorExtensionsEditSidebarView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      if(route2 !== 'extensions') {
        return;
      }
      Origin.trigger('location:title:update', { title: 'Manage extensions' });

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
});
