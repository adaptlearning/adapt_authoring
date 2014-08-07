define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var ThemeView = OriginView.extend({

    tagName: 'li',

    className: 'theme-list-item',

    events: {
      'click':'toggleSelect'
    },

    preRender: function() {},

    toggleSelect: function(event) {
      event && event.stopPropagation();

      if (this.model.get('_isSelected')) {
        this.deselectItem();
      } else {
        this.selectItem();
      } 
    },

    selectItem: function() {
      this.$el.addClass('selected');
      this.model.set({_isSelected: true});
    },

    deselectItem: function() {
      this.$el.removeClass('selected');
      this.model.set({_isSelected: false});
    }
    
  }, {
    template: 'editorThemeItem'
  });

  return ThemeView;

});