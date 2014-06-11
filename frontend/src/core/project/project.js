define(function(require) {
  
  var Origin = require('coreJS/app/origin');
  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/project/views/projectDetailView');

  Origin.on('navigation:user:logout', function() {
    Origin.router.navigate('#/user/logout');
  });

  Origin.on('navigation:profile:toggle', function() {
    console.log('Should show profile');
  });

  Origin.on('router:project', function(action, id) {

    switch (action) {
      case 'new':
        var project = new ProjectModel();
        Origin.trigger('location:title:update', {title: 'Add new course'});
        Origin.router.createView(ProjectDetailView, {model: project});
        console.log('new loaded');
        break;
      case 'edit':
        var projectModel = new ProjectModel({_id: id});
        projectModel.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Edit course'});
            Origin.router.createView(ProjectDetailView, {model: projectModel});
          }
        });
        break;
      case 'view':
        console.log('Should view project???');
        break;
    }

  });

})