// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ProjectsView = require('./views/projectsView');

  Origin.on('origin:dataReady login:changed', function() {
    Origin.router.setHomeRoute('projects');
  });

  Origin.on('globalMenu:projects:open', function() {
    Origin.router.navigateTo('projects');
  });

  Origin.on('router:projects', function(location, subLocation, action) {
    Origin.trigger('editor:resetData');
    initOptions();

    Origin.contentPane.setView(ProjectsView);
    Origin.sidebar.update({
      actions: [{ name: 'createproject', type: 'primary', label: 'buttons.addnewproject' }],
      links: [
        { name: 'my-projects', page: 'myprojects', label: 'buttons.myprojects' },
        { name: 'shared-projects', page: 'sharedprojects', label: 'buttons.sharedprojects' },
      ]
    });
  });

  function initOptions() {
    Origin.options.addItems([
      {
        title: Origin.l10n.t('buttons.grid'),
        icon: 'th',
        callbackEvent: 'projects:layout:grid',
        value: 'grid',
        group: 'layout',
      },
      {
        title: Origin.l10n.t('buttons.list'),
        icon: 'list',
        callbackEvent: 'projects:layout:list',
        value: 'list',
        group: 'layout'
      },
      {
        title: Origin.l10n.t('buttons.ascending'),
        icon: 'sort-alpha-asc',
        callbackEvent: 'projects:sort:asc',
        value: 'asc',
        group: 'sort'
      },
      {
        title: Origin.l10n.t('buttons.descending'),
        icon: 'sort-alpha-desc',
        callbackEvent: 'projects:sort:desc',
        value: 'desc',
        group: 'sort'
      },
      {
        title: Origin.l10n.t('buttons.recent'),
        icon: 'edit',
        callbackEvent: 'projects:sort:updated',
        value: 'updated',
        group: 'sort'
      }
    ]);
  }
});
