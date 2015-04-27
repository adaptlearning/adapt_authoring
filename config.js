// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require.config({
    paths: {
      jquery: 'core/libraries/jquery',
      underscore: 'core/libraries/underscore',
      backbone: 'core/libraries/backbone',
      modernizr: 'core/libraries/modernizr',
      handlebars: 'core/libraries/handlebars',
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
      tagsInput: 'core/libraries/jquery.tagsinput.min.js'
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
      polyglot: {
        exports: 'Polyglot'
      },
      jsoneditor: {
        deps: ['jquery'],
        exports: 'JsonEditor'
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
  	  'tagsInput': {
        deps: ['jquery'],
        exports: "$"
      }
    }
});