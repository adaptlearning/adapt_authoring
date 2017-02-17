// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ProjectsView = require('./views/projectsView');
  var ProjectsSidebarView = require('./views/projectsSidebarView');
  var MyProjectCollection = require('./collections/myProjectCollection');
  var SharedProjectCollection = require('./collections/sharedProjectCollection');
  var TagsCollection = require('core/collections/tagsCollection');

  function formatOptionItem(title, icon, cbEvent, value, group) {
    return {
      title: Origin.l10n.t('app.' + title),
      icon: icon,
      callbackEvent: cbEvent,
      value: value,
      group: group
    };
  }

  Origin.on('router:dashboard', function(location, subLocation, action) {
    Origin.trigger('editor:resetData');
    Origin.options.addItems([
      formatOptionItem('grid', 'th', 'dashboard:layout:grid', 'grid', 'layout'),
      formatOptionItem('list', 'list', 'dashboard:layout:list', 'list', 'layout'),
      formatOptionItem('ascending', 'sort-alpha-asc', 'dashboard:sort:asc', 'asc', 'sort'),
      formatOptionItem('descending', 'sort-alpha-desc', 'dashboard:sort:desc', 'desc', 'sort'),
      formatOptionItem('recent', 'edit', 'dashboard:sort:updated', 'updated', 'sort')
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
    var langKey, collection;
    if(options.type === 'shared') {
      langKey = 'app.sharedprojects';
      collection = SharedProjectCollection;
    }
    if(options.type === 'all') {
      langKey = 'app.myprojects';
      collection = MyProjectCollection;
    }
    Origin.trigger('location:title:update', { breadcrumbs: ['dashboard'], title: Origin.l10n.t(langKey) });
    Origin.contentPane.setView(ProjectsView, { collection: new collection });
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
  });
});
