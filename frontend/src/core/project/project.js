// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  
  var Origin = require('coreJS/app/origin');
  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/project/views/projectDetailView');
  var ProjectDetailEditSidebarView = require('coreJS/project/views/projectDetailEditSidebarView');

  Origin.on('navigation:help', function() {
    switch (Origin.location.module) {
      case 'dashboard':
        switch (Origin.location.route1) {
          case 'shared':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#shared-courses");
          return;
        default:
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#the-dashboard");
          return;
      }
      case 'project':
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-details");
        return;
      case 'editor':
        switch (Origin.location.route2) {
          case 'menu':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#editing-course-details");
            return;
          case 'block':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#adding-content-to-the-course");
            return;
          case 'edit':
             window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#sectionpage-settings");
            return;
          case 'page':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#adding-content-to-the-course");
            return;
          case 'config':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-settings");
            return;
          case 'theme':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-settings");
            return;
          case 'extensions':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#course-settings");
            return;
          default:
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/");
            return;
        }
        switch (Origin.location.route3) {
          case 'edit':
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Creating-a-Course#adding-content-to-the-course");
            return;
          default:
            window.open("https://github.com/adaptlearning/adapt_authoring/wiki/");
            return;
        }
        return;
      case 'pluginManagement':
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Plugin-Manager");
        return;
      case 'assetManagement':
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/Asset-Manager");
        return;
      default:
        window.open("https://github.com/adaptlearning/adapt_authoring/wiki/");
        return;
    }
  });

  Origin.on('router:project', function(action, id) {

    switch (action) {
      case 'new':
        var project = new ProjectModel();
        
        // Default the new project title
        project.set('title', window.polyglot.t('app.placeholdernewcourse'));
        project.set('displayTitle', window.polyglot.t('app.placeholdernewcourse'));
        
        var form = Origin.scaffold.buildForm({
          model: project
        });
        
        Origin.trigger('location:title:update', {title: window.polyglot.t('app.addnewproject')});
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
            Origin.trigger('location:title:update', {title: window.polyglot.t('app.editcourse')});
            Origin.editingOverlay.addView(new ProjectDetailView({model: project, form: form}).$el);
            Origin.sidebar.addView(new ProjectDetailEditSidebarView({form: form}).$el);
          }
        });
        break;
    }

  });

})