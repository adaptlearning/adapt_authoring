// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorExtensionsEditView = require('./views/editorExtensionsEditView');

  Origin.on('editor:extensions', function(data) {
    Origin.trigger('location:title:update', { title: 'Manage extensions' });

    var route1 = Origin.location.route1;
    var isMenu = data.type === "menu";

    console.log(data);

    Origin.sidebar.update({
      breadcrumb: {
        label: isMenu ? "Back to menu" : "Back to page",
        route: "/#/editor/" + route1 + (isMenu ? "/menu" : "/page/" + data.id)
      }
    });
    Origin.contentPane.setView(EditorExtensionsEditView, { model: new Backbone.Model({ _id: route1 }) });
  });
});
