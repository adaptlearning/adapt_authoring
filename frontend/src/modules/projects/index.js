// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ProjectsView = require('./views/projectsView');
  var ProjectsSidebarView = require('./views/projectsSidebarView');
  var MyProjectCollection = require('./collections/myProjectCollection');
  var SharedProjectCollection = require('./collections/sharedProjectCollection');
  var TagsCollection = require('core/collections/tagsCollection');

  Origin.on('origin:dataReady login:changed', function() {
    Origin.router.setHomeRoute('dashboard');
    Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.dashboard'),
      "icon": "fa-home",
      "callbackEvent": "dashboard:open",
      "sortOrder": 1
    });
  });

  Origin.on('globalMenu:dashboard:open', function() {
    Origin.router.navigateTo('dashboard');
  });

  Origin.on('router:dashboard', function(location, subLocation, action) {
    Origin.trigger('editor:resetData');

    Origin.trigger('location:title:update', { title: 'Dashboard - viewing my courses' });
    // not pretty, but condensed for brevity
    Origin.options.addItems([
      { title: Origin.l10n.t('app.grid'),       icon: 'th',              value: 'grid',    group: 'layout', callbackEvent: 'dashboard:layout:grid'  },
      { title: Origin.l10n.t('app.list'),       icon: 'list',            value: 'list',    group: 'layout', callbackEvent: 'dashboard:layout:list'  },
      { title: Origin.l10n.t('app.ascending'),  icon: 'sort-alpha-asc',  value: 'asc',     group: 'sort',   callbackEvent: 'dashboard:sort:asc'     },
      { title: Origin.l10n.t('app.descending'), icon: 'sort-alpha-desc', value: 'desc',    group: 'sort',   callbackEvent: 'dashboard:sort:desc'    },
      { title: Origin.l10n.t('app.recent'),     icon: 'edit',            value: 'updated', group: 'sort',   callbackEvent: 'dashboard:sort:updated' }
    ]);

    (new TagsCollection()).fetch({
      success: function(tags) {
        Origin.sidebar.addView(new ProjectsSidebarView({ collection: tags }).$el);
        Origin.trigger('dashboard:loaded', { type: location || 'all' });
      },
      error: function() {
        Origin.Notify.alert({
          type: 'error',
          text: Origin.l10n.t('app.errorfetchingdata')
        });
      }
    });
  });

  Origin.on('dashboard:loaded', function (options) {
    if(options.type === 'all') {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.myprojects') });
      Origin.contentPane.setView(ProjectsView, { collection: new MyProjectCollection() });
    }
    if(options.type === 'shared') {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.sharedprojects') });
      Origin.contentPane.setView(ProjectsView, { collection: new SharedProjectCollection() });
    }
  });
});
