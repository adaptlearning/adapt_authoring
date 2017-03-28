// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/app/origin');
  var EditorData = require('../global/editorDataLoader');
  var Helpers = require('../global/helpers');

  var ComponentModel = require('core/app/models/componentModel');
  var EditorComponentEditView = require('./views/editorComponentEditView');
  var EditorComponentEditSidebarView = require('./views/editorComponentEditSidebarView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      if (route2 === 'component') handleEditComponent();
    });
  });

  function handleEditComponent() {
    (new ComponentModel({ _id: Origin.location.route3 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        var displayName = getComponentDisplayName(model);
        Helpers.setPageTitle(model);
        Origin.sidebar.addView(new EditorComponentEditSidebarView({ model: model, form:form }).$el);
        Origin.contentPane.setView(EditorComponentEditView, { model: model, form: form });
      }
    });
  }

  function getComponentDisplayName(model) {
    var componentType = _.find(Origin.editor.data.componenttypes.models, function(m) {
      return m.get('_id') === model.get('_componentType');
    });
    return (componentType) ? componentType.get('displayName').toLowerCase() : '';
  }
});
