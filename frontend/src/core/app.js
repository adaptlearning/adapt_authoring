// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
(function() {
  function loadLibraries(callback) {
    require([
      'ace/ace',
      'imageReady',
      'inview',
      'jqueryForm',
      'jqueryUI',
      'mediaelement',
      'scrollTo',
      'sweetalert',
      'velocity'
    ], callback);
  }

  function loadCore(callback) {
    require([
      'templates/templates',
      'core/origin',
      'core/router',
      'core/permissions',
      'core/l10n',
      'core/constants',
      'core/helpers',
      'core/contextMenu',
      'core/contentPane'
    ], function(Templates, Origin) {
      var constantsLoaded = false;
      var l10nLoaded = false;
      Origin.once('constants:loaded', function() {
        constantsLoaded = true;
        if(l10nLoaded) callback();
      });
      Origin.once('l10n:loaded', function() {
        l10nLoaded = true;
        if(constantsLoaded) callback();
      });
    });
  }

  function loadModules(callback) {
    require(['modules/modules'], callback);
  }

  function loadPlugins(callback) {
    require(['plugins/plugins'], callback);
  }

  function initialiseApp() {
    require([
      'core/origin',
      'core/router',
      'modules/user/models/sessionModel',
      'modules/navigation/views/navigationView'
    ], function(Origin, Router, SessionModel, NavigationView) {
        Origin.router = new Router();
        Origin.sessionModel = new SessionModel();
        Origin.sessionModel.fetch({
          success: function(data) {
            // need the schemas before the app loads
            Origin.trigger('schemas:loadData', function() {
              Origin.trigger('app:dataReady');
              // _.defer to give anything tapping into app:dataReady event time to execute
              _.defer(Origin.initialize);
            });
          },
          error: console.error
        });
    });
  }

  /**
  * Start app load
  */
  loadLibraries(function() {
    loadCore(function() {
      loadModules(function() {
        loadPlugins(function() {
          initialiseApp();
        });
      });
    });
  });
})();
