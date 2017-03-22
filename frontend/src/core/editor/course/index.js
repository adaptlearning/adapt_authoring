// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var Helpers = require('../global/helpers');

  var EditorCourseModel = require('./models/editorCourseModel');
  var EditorCourseEditView = require('./views/editorCourseEditView');
  var EditorCourseEditViewSidebarView = require('./views/editorCourseEditSidebarView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    if(route2 === 'settings' || route2 === 'project' && route3 === 'edit') {
      renderCourseEdit();
    } else if(route2 === 'project' && route3 === 'new') {
      createNewCourse();
    }
  });
});

function renderCourseEdit() {
  (new EditorCourseModel({ _id: Origin.location.route1 })).fetch({
    success: function(model) {
      var form = Origin.scaffold.buildForm({ model: model });
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.editcourse') });
      Origin.editingOverlay.addView(new EditorCourseEditView({ model: model, form: form }).$el);
      Origin.sidebar.addView(new EditorCourseEditViewSidebarView({ form: form }).$el);
    }
  });
}

function createNewCourse() {
  // Default the new project title
  var model = new EditorCourseModel({
    title: window.polyglot.t('app.placeholdernewcourse'),
    displayTitle: window.polyglot.t('app.placeholdernewcourse')
  });

  var form = Origin.scaffold.buildForm({ model: model });

  Origin.trigger('location:title:update', { title: window.polyglot.t('app.addnewproject') });
  Origin.editingOverlay.addView(new EditorCourseEditView({ model: model, form: form }).$el);
  Origin.sidebar.addView(new EditorCourseEditViewSidebarView({ form: form }).$el);
}
