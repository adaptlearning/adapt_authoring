// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
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
      sweetalert: 'core/libraries/sweetalert.min',
      backboneForms:'core/libraries/backbone-forms',
      backboneFormsLists:'core/libraries/backbone-forms-lists',
      jsoneditor: 'core/libraries/jquery.jsoneditor.min',
      'jquery-ui': 'core/libraries/jquery-ui.min',
      'jquery-form' : 'core/libraries/jquery.form',
      typeahead: 'core/libraries/typeahead',
      velocity: 'core/libraries/velocity',
      scrollTo: 'core/libraries/scrollTo',
      colorPicker: 'core/libraries/colorPicker/js/colorpicker',
      'mediaelement' : 'core/libraries/mediaelement-and-player',
      editorPage: 'core/editor/page',
      editorMenu: 'core/editor/menu',
      editorCourse: 'core/editor/course',
      editorConfig: 'core/editor/config',
      editorTheme: 'core/editor/theme',
      editorMenuSettings: 'core/editor/menuSettings',
      editorGlobal: 'core/editor/global',
      editorExtensions: 'core/editor/extensions',
      tags: 'core/libraries/jquery.tagsinput.min',
      ace: 'core/libraries/ace',
      pikaday: 'core/libraries/pikaday/js/pikaday',
      moment: 'core/libraries/moment.min'
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
      sweetalert: {
        deps: ['jquery'],
        exports: 'sweetAlert'
      },
      jsoneditor: {
        deps: ['jquery'],
        exports: 'JsonEditor'
      },
      moment: {
        exports: 'moment'
      },
      'mediaelement': {
        deps: ['jquery'],
        exports: 'mediaelement'
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
      backboneForms: {
        deps: ['backbone']
      },
      backboneFormsLists: {
        deps: ['backboneForms']
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
      ace: {
        exports: 'ace/ace'
      },
      tags: {
        deps: ['jquery'],
        exports: "$"
      }
    }
});
