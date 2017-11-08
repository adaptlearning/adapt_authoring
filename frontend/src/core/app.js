// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
(function() {
  var origin;

  function loadLibraries(callback) {
    require([
      'ace/ace',
      'imageReady',
      'inview',
      'jqueryForm',
      'jqueryTagsInput',
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

  function loadAddOns(callback) {
    /*
    * FIXME we want to just be able to require these
    * (this doesn't work in production mode)
    */
    // ['modules/modules','plugins/plugins']
    require([
      // modules
      'modules/actions/index',
      'modules/assetManagement/index',
      'modules/contentPane/index',
      'modules/contextMenu/index',
      'modules/editor/index',
      'modules/filters/index',
      'modules/globalMenu/index',
      'modules/help/index',
      'modules/location/index',
      'modules/modal/index',
      'modules/navigation/index',
      'modules/notify/index',
      'modules/options/index',
      'modules/pluginManagement/index',
      'modules/projects/index',
      'modules/scaffold/index',
      'modules/sidebar/index',
      'modules/tenantManagement/index',
      'modules/user/index',
      'modules/userManagement/index',      
    ], callback);
  }

  /**
  * Start app load
  */
  loadLibraries(function() {
    loadCore(function() {
      loadAddOns(function() {
        // start session
        // FIXME required here to avoid errors
        require(['modules/user/models/sessionModel'], function(SessionModel) {
          origin.startSession(new SessionModel());
        });
      });
    });
  });
})();
