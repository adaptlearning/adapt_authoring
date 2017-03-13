// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var DashboardView = require('coreJS/dashboard/views/dashboardView');
  var DashboardSidebarView = require('coreJS/dashboard/views/dashboardSidebarView');
  var MyProjectCollection = require('coreJS/project/collections/myProjectCollection');
  var SharedProjectCollection = require('coreJS/project/collections/sharedProjectCollection');
  var TagsCollection = require('coreJS/tags/collections/tagsCollection');

  Origin.on('app:dataReady login:changed', onNewUser);

  Origin.on('globalMenu:dashboard:open', onDashboardOpen);
  Origin.on('router:dashboard', onDashboardRoute);
  Origin.on('dashboard:loaded', onDashboardLoaded);

  function onNewUser() {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": window.polyglot.t('app.dashboard'),
      "icon": "fa-home",
      "callbackEvent": "dashboard:open",
      "sortOrder": 1
    });
  }

  function onDashboardOpen() {
    Origin.router.navigate('#/dashboard', { trigger: true });
  }

  function onDashboardRoute(location, subLocation, action) {
    Origin.tap('dashboard', function onDashboardTap() {
      Origin.trigger('editor:resetData');

      Origin.trigger('location:title:update', {
        breadcrumbs: ['dashboard'],
        title: window.polyglot.t('app.myprojects')
      });

      addItems();

      loadTags(function(error, collection) {
        if(error) {
          return Origin.Notify.alert({ type: 'error', text: error.message });
        }
        Origin.sidebar.addView(new DashboardSidebarView({ collection:collection }).$el);
        var dashboardType = location || 'all';
        Origin.trigger('dashboard:loaded', { type: dashboardType });
      });
    });
  }

  function onDashboardLoaded(options) {
    switch (options.type) {
      case 'shared':
        Origin.trigger('location:title:update', {
          breadcrumbs: ['dashboard'],
          title: window.polyglot.t('app.sharedprojects')
        });
        Origin.router.createView(DashboardView, { collection: new SharedProjectCollection });
        break;
      case 'all':
        Origin.trigger('location:title:update', {
          breadcrumbs: ['dashboard'],
          title: window.polyglot.t('app.myprojects')
        });
        Origin.router.createView(DashboardView, { collection: new MyProjectCollection });
      default:
        break;
    }
  }

  function addItems() {
    Origin.options.addItems([
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
  }

  function loadTags(cb) {
    (new TagsCollection()).fetch({
      success: function(collection) {
        cb(null, collection);
      },
      error: function() {
        cb(new Error(window.polyglot.t('app.tagfetcherror')));
      }
    });
  }
});
