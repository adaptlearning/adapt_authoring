define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorComponentListView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-component-list",

    events: {
      'click .editing-overlay-component-option': 'onComponentClicked',
      'click .editing-overlay-component-layout button': 'onLayoutClicked'
    },

    preRender: function() {
      console.log(this);
    },

    onComponentClicked: function(event) {
      // Add selected class and store component data on model
      var $currentTarget = $(event.currentTarget).addClass('selected');
      var component = $currentTarget.attr('data-component')
      this.model.set('component', component);
      // Show layout options
      this.showLayoutOptions($currentTarget);
    },

    showLayoutOptions: function($currentTarget) {
      // Reset any open layout options opened
      $('.editing-overlay-component-option')
        .not($currentTarget)
        .removeClass('selected')
        .velocity({left: 0});

      // Get height of option so we can set button height
      var optionHeight = $('.editing-overlay-component-item').first().height();
      // Get width of all the buttons so we can move the overlay
      var buttonsWidth = $('.editing-overlay-component-layout').width();
      // Set button height
      this.$('.editing-overlay-component-layout button').height(optionHeight);
      // Set overlay animation
      $currentTarget.velocity({left: buttonsWidth});
    },

    onLayoutClicked: function(event) {
      var $currentTarget = $(event.currentTarget).addClass('selected');
      $('.editing-overlay-component-layout button')
        .not($currentTarget)
        .removeClass('selected');
      var layout = $currentTarget.attr('data-layout')
      this.model.set('layout', layout);
    },

    postRender: function() {

    }
  },
  {
    template: 'editorComponentList'
  });

  return EditorComponentListView;

});