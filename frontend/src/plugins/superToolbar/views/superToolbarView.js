// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');

  var SuperToolbarView = Backbone.View.extend({
    tagName: 'div',
    className: 'superToolbar',

    events: {
      'click .buttons button': 'onButtonClicked'
    },

    initialize: function() {
      this.render();
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template());
      return this;
    },

    setButtons: function(buttons) {
      this.$('.buttons > .inner').empty();

      for(var i = 0, count = buttons.length; i < count; i++) {
        var btnData = buttons[i];
        var $btn = $('<button>');
        var html = '';

        if(btnData.icon) html += '<i class="fa ' + btnData.icon + '"></i>';
        if(btnData.title) html += btnData.title;

        $btn.html(html);
        $btn.attr('data-event', btnData.event);

        this.$('.buttons > .inner').append($btn);
      }
    },

    onButtonClicked: function(e) {
      e && e.preventDefault();
      Origin.trigger('superToolbar:' + $(e.currentTarget).attr('data-event'));
    }
  }, {
    template: 'superToolbar'
  });

  return SuperToolbarView;
});
