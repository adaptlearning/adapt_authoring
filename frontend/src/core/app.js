// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
(function() {
  var origin;

  function loadLibraries(callback) {
    require([
      'ace/ace',
      'handlebars',
      'imageReady',
      'inview',
      'jqueryForm',
      'jqueryTagsInput',
      'jqueryUI',
      'mediaelement',
      'scrollTo',
      'sweetalert',
      'velocity'
    ], function() {
      window.Handlebars = $.extend(require('handlebars'), window.Handlebars);
      callback();
    });
  }

  function loadCore(callback) {
    require([
      'templates/templates',
      'core/origin',
      'core/router',
      'core/helpers',
      'core/permissions',
      'core/l10n',
      'core/constants'
    ], function(Templates, Origin, Router) {
      origin = Origin;
      origin.router = new Router();

      var constantsLoaded = false;
      var l10nLoaded = false;
      origin.once('constants:loaded', function() {
        constantsLoaded = true;
        if(l10nLoaded) callback();
      });
      origin.once('l10n:loaded', function() {
        l10nLoaded = true;
        if(constantsLoaded) callback();
      });
    });
  }

  function loadModules(callback) {
    require([
      'modules/modules'
    ], callback);
  }

  function loadPlugins(callback) {
    require([
      'plugins/plugins'
    ], callback);
  }

  /**
 * Start app load
 */
  loadLibraries(function() {
    loadCore(function() {
      loadModules(function() {
        loadPlugins(function() {
          // start session
          // FIXME required here to avoid errors
          require(['modules/user/models/sessionModel'], function(SessionModel) {
              origin.startSession(new SessionModel());
          });
        });
      });
    });
  });
})();
