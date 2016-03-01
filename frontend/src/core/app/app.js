// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require([
    'templates',
    'polyglot',
    'sweetalert',
    'coreJS/app/origin',
    'coreJS/app/router',
    'coreJS/app/permissions',
    'coreJS/user/user',
    'coreJS/project/project',
    'coreJS/dashboard/dashboard',
    'coreJS/courseImport/courseImport',
    'coreJS/editor/editor',
    'coreJS/assetManagement/assetManagement',
    'coreJS/pluginManagement/pluginManagement',
    'coreJS/user/models/sessionModel',
    'coreJS/navigation/views/navigationView',
    'coreJS/globalMenu/globalMenu',
    'coreJS/sidebar/sidebar',
    'coreJS/app/helpers',
    'coreJS/app/contextMenu',
    'coreJS/location/location',
    'plugins/plugins',
    'coreJS/notify/notify',
    'coreJS/editingOverlay/editingOverlay',
    'coreJS/options/options',
    'coreJS/scaffold/scaffold',
    'coreJS/modal/modal',
    'coreJS/filters/filters',
    'coreJS/actions/actions',
    'jquery-ui',
    'jquery-form',
    'inview',
    'imageReady',
    'mediaelement',
    'velocity',
    'scrollTo',
    'ace/ace'
], function (
    Templates,
    Polyglot,
    SweetAlert,
    Origin,
    Router,
    Permissions,
    User,
    Project,
    Dashboard,
    CourseImport,
    Editor,
    AssetManagement,
    PluginManagement,
    SessionModel,
    NavigationView,
    GlobalMenu,
    Sidebar,
    Helpers,
    ContextMenu,
    Location,
    Notify,
    EditingOverlay,
    Options,
    Scaffold,
    Modal,
    JQueryUI,
    JQueryForm,
    Inview,
    ImageReady,
    MediaElement
) {

  // Read in the configuration values/constants
  $.getJSON('config/config.json', function(configData) {
    Origin.constants = configData;

    var locale = localStorage.getItem('lang') || 'en';

    // Get the language file
    $.getJSON('lang/' + locale, function(data) {
      // Instantiate Polyglot with phrases
      window.polyglot = new Polyglot({phrases: data});

      Origin.sessionModel = new SessionModel();

      Origin.router = new Router();

      Origin.sessionModel.fetch({
        success: function(data) {
          // This callback is called from the schemasModel.js in scaffold as the schemas
          // need to load before the app loads
          Origin.trigger('app:userCreated', function() {

              $('#app').before(new NavigationView({model: Origin.sessionModel}).$el);
              Origin.trigger('app:dataReady');
              // Defer here is good - give anything tapping in app:dataReady event
              // time to do their thang!
              _.defer(function() {
                  Origin.initialize();
              });
          });

        }
      });
    });
  });

});
