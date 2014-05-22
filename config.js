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
      'jquery-ui': 'core/libraries/jquery-ui.min'
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
      'jquery-ui': {
        deps: ['jquery'],
        exports: "$"
      }
    }
});