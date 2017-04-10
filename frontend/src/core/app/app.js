// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require([
    'templates',
    'polyglot',
    'sweetalert',
    'core/app/origin',
    'core/app/router',
    'core/app/permissions',
    'core/app/contentPane',
    'core/user/user',
    'core/help/help',
    'core/dashboard/dashboard',
    'core/editor/editor',
    'core/assetManagement/assetManagement',
    'core/pluginManagement/pluginManagement',
    'core/user/models/sessionModel',
    'core/navigation/views/navigationView',
    'core/globalMenu/globalMenu',
    'core/sidebar/sidebar',
    'core/app/helpers',
    'core/app/contextMenu',
    'core/location/location',
    'plugins/plugins',
    'core/notify/notify',
    'core/options/options',
    'core/scaffold/scaffold',
    'core/modal/modal',
    'core/filters/filters',
    'core/actions/actions',
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
    ContentPane,
    User,
    Help,
    Dashboard,
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
