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
      backboneForms:'core/libraries/backbone-forms',
      backboneFormsLists:'core/libraries/backbone-forms-lists',
      jsoneditor: 'core/libraries/jquery.jsoneditor.min',
      'jquery-ui': 'core/libraries/jquery-ui.min',
      'jquery-form' : 'core/libraries/jquery.form',
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
      tags: 'core/libraries/jquery.tagsinput.min'
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
      tags: {
        deps: ['jquery'],
        exports: "$"
      }
    }
});