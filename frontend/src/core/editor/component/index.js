// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorData = require('../global/editorDataLoader');

  var EditorComponentEditView = require('./views/editorComponentEditView');
  var EditorComponentEditSidebarView = require('./views/editorComponentEditSidebarView');
  var EditorComponentModel = require('./models/editorComponentModel');
  var EditorComponentListView = require('./views/editorComponentListView');
  var EditorComponentListSidebarView = require('./views/editorComponentListSidebarView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      if(route2 === 'block' && route4 === 'add') {
        // block->add, so we're actually adding a component
        handleNewComponent();
      } else if (route2 === 'component') {
        handleEditComponent();
      }
    });
  });

  function handleNewComponent() {
    var containingBlock = Origin.editor.data.blocks.findWhere({ _id: Origin.location.route3 });
    var layoutOptions = containingBlock.get('layoutOptions');
    var componentsModel = new Backbone.Model({
      title: window.polyglot.t('app.addcomponent'),
      body: window.polyglot.t('app.pleaseselectcomponent'),
      _parentId: route3,
      componentTypes: Origin.editor.data.componentTypes.toJSON(),
      layoutOptions: layoutOptions
    });
    Origin.sidebar.addView(new EditorComponentListSidebarView({ model: componentsModel }).$el);
    Origin.contentPane.setView(EditorComponentListView, { model: componentsModel });
  }

  function handleEditComponent() {
    (new EditorComponentModel({ _id: Origin.location.route3 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        var displayName = getComponentDisplayName(model);
        Origin.trigger('location:title:update', { title: 'Editing ' + displayName + ' component - ' + model.get('title') });
        Origin.sidebar.addView(new EditorComponentEditSidebarView({ model: model, form:form }).$el);
        Origin.contentPane.setView(EditorComponentEditView, { model: model, form: form });
      }
    });
  }

  function getComponentDisplayName(model) {
    var componentType = _.find(Origin.editor.data.componentTypes.models, function(m) {
      return m.get('_id') === model.get('_componentType');
    });
    return (componentType) ? componentType.get('displayName').toLowerCase() : '';
  }
});
