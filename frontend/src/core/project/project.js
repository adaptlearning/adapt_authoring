// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  
  var Origin = require('coreJS/app/origin');
  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/project/views/projectDetailView');
  var ProjectDetailEditSidebarView = require('coreJS/project/views/projectDetailEditSidebarView');

  Origin.on('navigation:help', function() {
    switch (Origin.location.module) {
      case 'dashboard':
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#the-dashboard");
        break;
      case 'project':
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-details");
        break;
      case 'editor':
        switch (Origin.location.route2) {
          case 'menu':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#editing-course-details");
            break;
          case 'block':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#adding-content-to-the-course");
            break;
          case 'edit':
             window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#sectionpage-settings");
            break;
          case 'page':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#adding-content-to-the-course");
            break;
          case 'config':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-settings");
            break;
          case 'theme':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-settings");
            break;
          case 'extensions':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-settings");
            break;
          default:
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/");
            break;
        }
        switch (Origin.location.route3) {
          case 'edit':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#adding-content-to-the-course");
            break;
          default:
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/");
            break;
        }
        break;
      case 'pluginManagement':
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Plugin-Manager");
        break;
      case 'assetManagement':
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Asset-Manager");
        break;
      default:
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/");
        break;
    }
  });

  Origin.on('router:project', function(action, id) {

    switch (action) {
      case 'new':
        var project = new ProjectModel();
        var form = Origin.scaffold.buildForm({
          model: project
        });
        Origin.trigger('location:title:update', {title: 'Add new course'});
        Origin.editingOverlay.addView(new ProjectDetailView({model: project, form: form}).$el);
        Origin.sidebar.addView(new ProjectDetailEditSidebarView({form: form}).$el);
        break;
      case 'edit':
        var project = new ProjectModel({_id: id});
        project.fetch({
          success: function() {
            var form = Origin.scaffold.buildForm({
              model: project
            });
            Origin.trigger('location:title:update', {title: 'Edit course'});
            Origin.editingOverlay.addView(new ProjectDetailView({model: project, form: form}).$el);
            Origin.sidebar.addView(new ProjectDetailEditSidebarView({form: form}).$el);
          }
        });
        break;
    }

  });

})