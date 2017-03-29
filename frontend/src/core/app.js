// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require([
  'polyglot',
  'core/origin',
  'core/router',
  'modules/user/models/sessionModel',
  'modules/navigation/views/navigationView',
  // third-party libs
  'ace/ace',
  'imageReady',
  'inview',
  'jqueryForm',
  'jqueryUI',
  'mediaelement',
  'scrollTo',
  'sweetalert',
  'velocity',
  // internal
  'templates/templates',
  'modules/modules',
  'plugins/plugins',

], function onLibrariesLoaded(Polyglot, Origin, Router, SessionModel, NavigationView) {
  // Read in the configuration values/constants
  $.getJSON('config/config.json', function(configData) {
    Origin.constants = configData;

    var locale = localStorage.getItem('lang') || 'en';
    // Get the language file
    $.getJSON('lang/' + locale, function(data) {
      // Instantiate Polyglot with phrases
      window.polyglot = new Polyglot({ phrases: data });

      Origin.router = new Router();

      Origin.sessionModel = new SessionModel();
      Origin.sessionModel.fetch({
        success: function(data) {
          // This callback is called from the schemasModel.js in scaffold as the schemas
          // need to load before the app loads
          Origin.trigger('app:userCreated', function() {
            // TODO move this to the navigation modules folder
            $('#app').before(new NavigationView({ model: Origin.sessionModel }).$el);
            Origin.trigger('app:dataReady');
            // Defer here is good - give anything tapping in app:dataReady event
            // time to do their thang!
            _.defer(Origin.initialize);
          });
        }
      });
    });
  });
});
