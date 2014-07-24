define(function(require) {
  
  var Origin = require('coreJS/app/origin');
  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/project/views/projectDetailView');
  var ProjectDetailEditSidebarView = require('coreJS/project/views/projectDetailEditSidebarView');

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
        Origin.editingOverlay.addView(new ProjectDetailView({model: project}).$el);
        Origin.sidebar.addView(new ProjectDetailEditSidebarView().$el);
        break;
      case 'edit':
        var project = new ProjectModel({_id: id});
        
        project.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Edit course'});
            Origin.editingOverlay.addView(new ProjectDetailView({model: project}).$el);
            Origin.sidebar.addView(new ProjectDetailEditSidebarView().$el);
          }
        });
        break;
      case 'view':
        console.log('Should view project???');
        break;
    }

  });

})