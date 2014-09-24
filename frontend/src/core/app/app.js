require.config({
    baseUrl: '../../',
    paths: {
      jquery: 'core/libraries/jquery',
      underscore: 'core/libraries/underscore',
      backbone: 'core/libraries/backbone',
      modernizr: 'core/libraries/modernizr',
      handlebars: 'core/libraries/handlebars',
      inview: 'core/libraries/inview',
      imageReady: 'core/libraries/imageReady',
      coreJS: 'core',
      templates: 'templates/templates',
      polyglot: 'core/libraries/polyglot.min',
      jsoneditor: 'core/libraries/jquery.jsoneditor.min',
      'jquery-ui': 'core/libraries/jquery-ui.min',
      'jquery-form' : 'core/libraries/jquery.form',
      velocity: 'core/libraries/velocity',
      scrollTo: 'core/libraries/scrollTo',
      'mediaelement-and-player' : 'core/libraries/mediaelement-and-player',
      editorPage: 'core/editor/page',
      editorMenu: 'core/editor/menu',
      editorCourse: 'core/editor/course',
      editorConfig: 'core/editor/config',
      editorTheme: 'core/editor/theme',
      editorGlobal: 'core/editor/global',
      editorExtensions: 'core/editor/extensions',
      tinymce: 'core/libraries/tinymce/tinymce.min'
    },
    shim: {
      jquery: [

      ],
      backbone: {
          deps: [
            'underscore',
            'jquery'
          ],
          exports: 'Backbone'
      },
      underscore: {
          exports: '_'
      },
      handlebars: {
        exports: 'Handlebars'
      },
      templates: {
        deps:['handlebars']
      },
      polyglot: {
        exports: 'Polyglot'
      },
      jsoneditor: {
        deps: ['jquery'],
        exports: 'JsonEditor'
      },
      'mediaelement-and-player': {
        deps: ['jquery'],
        exports: 'mediaelement-and-player'
      },
      velocity: {
        deps: ['jquery'],
        exports: 'velocity'
      },
      scrollTo: {
        deps: ['jquery'],
        exports: 'scrollTo'
      },
      'jquery-ui': {
        deps: ['jquery'],
        exports: "$"
      },
      'jquery-form': {
        deps: ['jquery'],
        exports: "$"
      },
      inview: {
        deps: [
          'jquery'
        ],
        exports: 'inview'
      },
      imageReady: {
        deps: [
          'jquery'
        ],
        exports: 'imageready'
      },
      tinyMCE: {
        exports: 'tinyMCE',
        init: function () {
          this.tinyMCE.DOM.events.domLoaded = true;
          return this.tinyMCE;
        }
      }
    }
});

require([
    'templates',
    'coreJS/app/origin',
    'coreJS/app/router',
    'coreJS/user/user',
    'coreJS/project/project',
    'coreJS/dashboard/dashboard',
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
    'coreJS/notify/notify',
    'coreJS/editingOverlay/editingOverlay',
    'polyglot',
    'jquery-ui',
    'jquery-form',
    'inview',
    'imageReady',
    'mediaelement-and-player',
    'velocity',
    'scrollTo'
], function (
    Templates,
    Origin,
    Router,
    User,
    Project,
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
    EditingOverlay,
    Polyglot,
    JQueryUI,
    JQueryForm,
    Inview,
    ImageReady,
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
