define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var Handlebars = require('handlebars');

  var MenuSettingsView = OriginView.extend({

    tagname: 'li',

    className: function() {
      var isSelectedClass = (this.model.get('_selected')) ? ' selected' : '';

      return 'menusettings-list-item' + isSelectedClass;
    },

    events: {
      'click' : 'toggleSelect'
    },

    preRender: function() {
      this.listenTo(Origin, 'editor:menuSettings:selected', this.deselectItem);
    },

    toggleSelect: function(event) {
      event && event.stopPropagation();

      if (!this.model.get('_isSelected')) {
        this.selectItem();
      } 
    },

    selectMenu: function() {
      Origin.trigger('editor:menuSettings:selected');
      
      this.$el.addClass('selected');
      this.model.set({_isSelected: true});
    },

    deselectMenu: function() {
      this.$el.removeClass('selected');
      this.model.set({_isSelected: false});
    }


  }, {
    template: 'editorMenuSettingsItem'
  });

  return MenuSettingsView;

});