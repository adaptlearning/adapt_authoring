// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ProjectsView = require('./views/projectsView');
  var ProjectsSidebarView = require('./views/projectsSidebarView');
  var MyProjectCollection = require('./collections/myProjectCollection');
  var SharedProjectCollection = require('./collections/sharedProjectCollection');
  var TenantProjectCollection = require('./collections/tenantProjectCollection');
  var TagsCollection = require('core/collections/tagsCollection');

  Origin.on('router:dashboard', function(location, subLocation, action) {
    Origin.trigger('editor:resetData');

    Origin.trigger('location:title:update', {title: 'Dashboard - viewing my courses'});
    Origin.options.addItems([
      {
        title: Origin.l10n.t('app.grid'),
        icon: 'th',
        callbackEvent: 'dashboard:layout:grid',
        value: 'grid',
        group: 'layout',
      },
      {
        title: Origin.l10n.t('app.list'),
        icon: 'list',
        callbackEvent: 'dashboard:layout:list',
        value: 'list',
        group: 'layout'
      },
      {
        title: Origin.l10n.t('app.ascending'),
        icon: 'sort-alpha-asc',
        callbackEvent: 'dashboard:sort:asc',
        value: 'asc',
        group: 'sort'
      },
      {
        title: Origin.l10n.t('app.descending'),
        icon: 'sort-alpha-desc',
        callbackEvent: 'dashboard:sort:desc',
        value: 'desc',
        group: 'sort'
      },
      {
        title: Origin.l10n.t('app.recent'),
        icon: 'edit',
        callbackEvent: 'dashboard:sort:updated',
        value: 'updated',
        group: 'sort'
      }
    ]);

    var tagsCollection = new TagsCollection();

    tagsCollection.fetch({
      success: function() {
        Origin.sidebar.addView(new ProjectsSidebarView({ collection: tagsCollection }).$el);
        Origin.trigger('dashboard:loaded', { type: location || 'all' });
      },
      error: function() {
        console.log('Error occured getting the tags collection - try refreshing your page');
      }
    });
  });

  Origin.on('dashboard:loaded', function (options) {
    switch (options.type) {
      case 'shared':
        Origin.trigger('location:title:update', {title: 'Dashboard - viewing shared courses'});
        Origin.contentPane.setView(ProjectsView, { collection: new SharedProjectCollection });
        break;
      case 'tenant':
        if (Origin.permissions.hasTenantAdminPermission()) {
           Origin.trigger('location:title:update', {title: 'Dashboard - viewing tenant courses'});
           Origin.contentPane.setView(ProjectsView, {collection: new TenantProjectCollection});
         }
         break;  
      case 'all':
        Origin.trigger('location:title:update', {title: 'Dashboard - viewing my courses'});
        Origin.contentPane.setView(ProjectsView, { collection: new MyProjectCollection });
      default:
        break;
    }
  });

  Origin.on('globalMenu:dashboard:open', function() {
    Origin.router.navigateTo('dashboard');
  });

  Origin.on('origin:dataReady login:changed', function() {
    Origin.router.setHomeRoute('dashboard');
    Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.dashboard'),
      "icon": "fa-home",
      "callbackEvent": "dashboard:open",
      "sortOrder": 1
    });
    Origin.permissions.addRoute('tenantCourses', ["{{tenantid}}/*:delete"]);
  });
});
