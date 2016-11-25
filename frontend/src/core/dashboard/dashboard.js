// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var DashboardSidebarView = require('coreJS/dashboard/views/dashboardSidebarView');
  var MyProjectCollection = require('coreJS/project/collections/myProjectCollection');
  var SharedProjectCollection = require('coreJS/project/collections/sharedProjectCollection');
  var TagsCollection = require('coreJS/tags/collections/tagsCollection');

  Origin.on('router:dashboard', function(location, subLocation, action) {
    Origin.tap('dashboard', function() {
      Origin.trigger('editor:resetData');
      console.log('dashboard:', Origin.editor.data);
      // TODO localise
      Origin.trigger('location:title:update', { title: 'Dashboard - viewing my courses' });
      Origin.options.addItems([
        {
          title: window.polyglot.t('app.thumb'),
          icon: 'th',
          callbackEvent: 'dashboard:layout:thumb',
          value: 'thumb',
          group: 'layout',
        },
        {
          title: window.polyglot.t('app.grid'),
          icon: 'th-large',
          callbackEvent: 'dashboard:layout:grid',
          value: 'grid',
          group: 'layout',
        },
        {
          title: window.polyglot.t('app.list'),
          icon: 'list',
          callbackEvent: 'dashboard:layout:list',
          value: 'list',
          group: 'layout'
        },
        {
          title: window.polyglot.t('app.ascending'),
          icon: 'sort-alpha-asc',
          callbackEvent: 'dashboard:sort:asc',
          value: 'asc',
          group: 'sort'
        },
        {
          title: window.polyglot.t('app.descending'),
          icon: 'sort-alpha-desc',
          callbackEvent: 'dashboard:sort:desc',
          value: 'desc',
          group: 'sort'
        },
        {
          title: window.polyglot.t('app.recent'),
          icon: 'edit',
          callbackEvent: 'dashboard:sort:updated',
          value: 'updated',
          group: 'sort'
        }
      ]);

      (new TagsCollection()).fetch({
        success: function(collection) {
          Origin.sidebar.addView(new DashboardSidebarView({ collection:collection }).$el);
          var dashboardType = location || 'all';
          Origin.trigger('dashboard:loaded', { type: dashboardType });
        },
        error: function() {
          // TODO localise
          Origin.Notify.alert({
            type: 'error',
            text: 'Error occured getting the tags collection - try refreshing your page'
          });
        }
      });
    });
  });

  Origin.on('dashboard:loaded', function (options) {
    // TODO localise these
    switch (options.type) {
      case 'shared':
        Origin.trigger('location:title:update', {title: 'Dashboard - viewing shared courses'});
        Origin.router.createView(DashboardView, {collection: new SharedProjectCollection});
        break;
      case 'all':
        Origin.trigger('location:title:update', {title: 'Dashboard - viewing my courses'});
        Origin.router.createView(DashboardView, {collection: new MyProjectCollection});
      default:
        break;
    }
  });

  Origin.on('globalMenu:dashboard:open', function() {
    Origin.router.navigate('#/dashboard', { trigger: true });
  });

  Origin.on('app:dataReady login:changed', function() {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": "Dashboard",
      "icon": "fa-home",
      "callbackEvent": "dashboard:open",
      "sortOrder": 1
    });
  });
});
