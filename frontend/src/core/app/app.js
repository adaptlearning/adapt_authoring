require([
    'coreJS/app/origin',
    'coreJS/app/router',
    'coreJS/user/user',
    'coreJS/project/project',
    'coreJS/dashboard/dashboard',
    'coreJS/editor/editor',
    'coreJS/assetManagement/assetManagement',
    'coreJS/user/models/sessionModel',
    'coreJS/navigation/views/navigationView',
    'coreJS/globalMenu/globalMenu',
    'coreJS/sidebar/sidebar',
    'coreJS/app/helpers',
    'coreJS/app/contextMenu',
    'coreJS/location/location',
    'coreJS/notify/notify',
    'coreJS/editingOverlay/editingOverlay',
    'polyglot',
    'jquery-ui',
    'jquery-form',
    'mediaelement-and-player',
    'velocity',
    'scrollTo',
    'templates'
], function (
    Origin, 
    Router, 
    User, 
    Project, 
    Dashboard, 
    Editor, 
    AssetManagement, 
    SessionModel, 
    NavigationView, 
    GlobalMenu, 
    Sidebar, 
    Helpers, 
    ContextMenu, 
    Location, 
    Notify, 
    EditingOverlay,
    Polyglot, 
    JQueryUI, 
    JQueryForm, 
    MediaElement
) {

  var locale = localStorage.getItem('lang') || 'en';
  // Get the language file
  $.getJSON('lang/' + locale, function(data) {
    // Instantiate Polyglot with phrases
    window.polyglot = new Polyglot({phrases: data});

    Origin.sessionModel = new SessionModel();

    Origin.router = new Router();

    Origin.sessionModel.fetch({
      success: function(data) {
        $('#app').before(new NavigationView({model: Origin.sessionModel}).$el);
        Origin.trigger('app:dataReady');
        Origin.initialize();
      }
    });
  });    
});
