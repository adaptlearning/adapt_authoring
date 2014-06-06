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
      'mediaelement-and-player' : 'core/libraries/mediaelement-and-player'
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
      'jquery-ui': {
        deps: ['jquery'],
        exports: "$"
      },
      'jquery-form': {
        deps: ['jquery'],
        exports: "$"
      }
    }
});