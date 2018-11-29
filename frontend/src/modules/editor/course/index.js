// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var CourseModel = require('core/models/courseModel');
  var EditorCourseEditView = require('./views/editorCourseEditView');
  var CoreHelpers = require('core/helpers');
  var EditorHelpers = require('../global/helpers');

  Origin.on({
    'editor:course': renderCourseEdit,
    'router:project': function(route1, route2, route3, route4) {
      if(route1 === 'new') createNewCourse();
    }
  });

  function renderCourseEdit() {
    var courseModel = new CourseModel({ _id: Origin.location.route1 });
    // FIXME need to fetch config to ensure scaffold has the latest extensions data
    CoreHelpers.multiModelFetch([ courseModel, Origin.editor.data.config ], function(data) {
      EditorHelpers.setPageTitle({ title: Origin.l10n.t('app.editorsettings') });
      var form = Origin.scaffold.buildForm({ model: courseModel });
      EditorHelpers.setContentSidebar({ fieldsets: form.fieldsets });
      Origin.contentPane.setView(EditorCourseEditView, { model: courseModel, form: form });
    });
  }

  function createNewCourse() {
    var model = new CourseModel({
      title: Origin.l10n.t('app.placeholdernewcourse'),
      displayTitle: Origin.l10n.t('app.placeholdernewcourse')
    });
    EditorHelpers.setPageTitle({ title: Origin.l10n.t('app.editornew') });
    var form = Origin.scaffold.buildForm({ model: model });
    EditorHelpers.setContentSidebar({ fieldsets: form.fieldsets });
    Origin.contentPane.setView(EditorCourseEditView, { model: model, form: form });
  }
});
