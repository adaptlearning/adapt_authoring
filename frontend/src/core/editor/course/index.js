// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/app/origin');
  var EditorData = require('../global/editorDataLoader');

  var EditorCourseModel = require('./models/editorCourseModel');
  var EditorCourseEditView = require('./views/editorCourseEditView');
  var EditorCourseEditSidebarView = require('./views/editorCourseEditSidebarView');

  Origin.on('router:project', function(route1, route2, route3, route4) {
    if(route1 === 'new') createNewCourse();
  });

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      if(route2 === 'settings') renderCourseEdit();
    });
  });

  function renderCourseEdit() {
    console.log(Origin.location.module);
    (new EditorCourseModel({ _id: Origin.location.route1 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        Origin.trigger('location:title:update', { title: window.polyglot.t('app.editcourse') });
        Origin.contentPane.setView(EditorCourseEditView, { model: model, form: form });
        Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
      }
    });
  }

  function createNewCourse() {
    var model = new EditorCourseModel({
      title: window.polyglot.t('app.placeholdernewcourse'),
      displayTitle: window.polyglot.t('app.placeholdernewcourse')
    });
    var form = Origin.scaffold.buildForm({ model: model });
    Origin.trigger('location:title:update', { title: window.polyglot.t('app.addnewproject') });
    Origin.contentPane.setView(EditorCourseEditView, { model: model, form: form });
    Origin.sidebar.addView(new EditorCourseEditSidebarView({ form: form }).$el);
  }
});
