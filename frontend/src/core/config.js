// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require.config({
  paths: {
    // third-party libs
    ace: 'core/libraries/ace',
    backbone: 'core/libraries/backbone',
    backboneForms:'core/libraries/backbone-forms',
    backboneFormsLists:'core/libraries/backbone-forms-lists',
    colorPicker: 'core/libraries/colorPicker/js/colorpicker',
    handlebars: 'core/libraries/handlebars',
    imageReady: 'core/libraries/imageReady',
    inview: 'core/libraries/inview',
    jquery: 'core/libraries/jquery',
    'jquery-form' : 'core/libraries/jquery.form',
    'jquery-ui': 'core/libraries/jquery-ui.min',
    jsoneditor: 'core/libraries/jquery.jsoneditor.min',
    mediaelement : 'core/libraries/mediaelement-and-player',
    modernizr: 'core/libraries/modernizr',
    moment: 'core/libraries/moment.min',
    pikaday: 'core/libraries/pikaday/js/pikaday',
    polyglot: 'core/libraries/polyglot.min',
    scrollTo: 'core/libraries/scrollTo',
    sweetalert: 'core/libraries/sweetalert.min',
    tags: 'core/libraries/jquery.tagsinput.min',
    typeahead: 'core/libraries/typeahead',
    underscore: 'core/libraries/underscore',
    velocity: 'core/libraries/velocity',
    // internal aliases
    templates: 'templates/templates'
  },
  shim: {
    // third-party
    ace: {
      exports: 'ace/ace'
    },
    backbone: {
      deps: ['underscore','jquery'],
      exports: 'Backbone'
    },
    backboneForms: {
      deps: ['backbone']
    },
    backboneFormsLists: {
      deps: ['backboneForms']
    },
    colorPicker: {
      deps: ['jquery'],
    },
    handlebars: {
      exports: 'Handlebars'
    },
    imageReady: {
      deps: ['jquery'],
      exports: 'imageready'
    },
    inview: {
      deps: ['jquery'],
      exports: 'inview'
    },
    'jquery-form': {
      deps: ['jquery'],
      exports: "$"
    },
    'jquery-ui': {
      deps: ['jquery'],
      exports: "$"
    },
    jsoneditor: {
      deps: ['jquery'],
      exports: 'JsonEditor'
    },
    mediaelement: {
      deps: ['jquery'],
      exports: 'mediaelement'
    },
    moment: {
      exports: 'moment'
    },
    polyglot: {
      exports: 'Polyglot'
    },
    scrollTo: {
      deps: ['jquery'],
      exports: 'scrollTo'
    },
    sweetalert: {
      deps: ['jquery'],
      exports: 'sweetAlert'
    },
    tags: {
      deps: ['jquery'],
      exports: "$"
    },
    underscore: {
      exports: '_'
    },
    velocity: {
      deps: ['jquery'],
      exports: 'velocity'
    },
    // internal
    templates: {
      deps:['handlebars']
    }
  }
});
