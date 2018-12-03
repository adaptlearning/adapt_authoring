// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ProjectsView = require('./views/projectsView');

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
    initOptions();

    Origin.trigger('location:title:update');
    Origin.contentPane.setView(ProjectsView);
    Origin.sidebar.update({
      actions: [{ name: 'createproject', type: 'primary', labels: { default: 'app.addnewproject' } }],
      links: [
        { name: 'my-projects', page: 'myprojects', label: 'app.myprojects' },
        { name: 'shared-projects', page: 'sharedprojects', label: 'app.sharedprojects' },
      ]
    });
  });

  function initOptions() {
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
  }
});
