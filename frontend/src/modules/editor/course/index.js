// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Helpers = require('../global/helpers');

  var CourseModel = require('core/models/courseModel');
  var EditorCourseEditView = require('./views/editorCourseEditView');
  var EditorCourseEditSidebarView = require('./views/editorCourseEditSidebarView');
  var Helpers = require('../global/helpers');

  Origin.on('router:project', function(route1, route2, route3, route4) {
    if(route1 === 'new') createNewCourse();
  });
  Origin.on('editor:course', renderCourseEdit);

  function renderCourseEdit() {
    (new CourseModel({ _id: Origin.location.route1 })).fetch({
      success: function(model) {
        Helpers.setPageTitle(model);
        var form = Origin.scaffold.buildForm({ model: model });
        Origin.contentPane.setView(EditorCourseEditView, { model: model, form: form });
        Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
      }
    });
  }

  function createNewCourse() {
    var model = new CourseModel({
      title: Origin.l10n.t('app.placeholdernewcourse'),
      displayTitle: Origin.l10n.t('app.placeholdernewcourse')
    });
    Helpers.setPageTitle(model);
    var form = Origin.scaffold.buildForm({ model: model });
    Origin.contentPane.setView(EditorCourseEditView, { model: model, form: form });
    Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
  }
});
