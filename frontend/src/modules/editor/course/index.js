// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var CourseModel = require('core/models/courseModel');
  var EditorCourseEditView = require('./views/editorCourseEditView');
  var EditorCourseEditSidebarView = require('./views/editorCourseEditSidebarView');
  var CoreHelpers = require('core/helpers');
  var EditorHelpers = require('../global/helpers');

  Origin.on('router:project', function(route1, route2, route3, route4) {
    if(route1 === 'new') createNewCourse();
  });
  Origin.on('editor:course', renderCourseEdit);

  function renderCourseEdit() {
    var courseModel = new CourseModel({ _id: Origin.location.route1 });
    // FIXME need to fetch config to ensure scaffold has the latest extensions data
    CoreHelpers.multiModelFetch([ courseModel, Origin.editor.data.config ], function(data) {
      EditorHelpers.setPageTitle(courseModel);
      var form = Origin.scaffold.buildForm({ model: courseModel });
      Origin.contentPane.setView(EditorCourseEditView, { model: courseModel, form: form });
      Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
    });
  }

  function createNewCourse() {
    var model = new CourseModel();
    Origin.trigger('location:title:update', {
      breadcrumbs: ['dashboard'],
      title: Origin.l10n.t('app.editornew')
    });
    var form = Origin.scaffold.buildForm({ model: model });
    Origin.contentPane.setView(EditorCourseEditView, { model: model, form: form });
    Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
  }
});
