// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var ThemeItemView = OriginView.extend({
    tagName: 'li',

    settings: {
      autoRender: true
    },

    className: function() {
      var isSelectedClass = (this.model.get('_isSelected')) ? ' selected' : '';
      return 'theme-list-item' + isSelectedClass;
    },

    events: {
      'click': 'toggleSelect'
    },

    preRender: function() {
      this.listenTo(Origin, 'editor:theme:selected', this.deselectItem);
    },

    postRender: function() {
      var previewUrl = '/api/theme/preview/' + this.model.get('name') + '/' + this.model.get('name');
      var $previewLoc = this.$('.theme-preview');

      $.ajax(previewUrl, {
        statusCode: {
          200: function() {
            $previewLoc.prepend($('<img/>', { src: previewUrl, alt: Origin.l10n.t('app.themepreviewalt') }));
          },
          204: function() {
            $previewLoc.prepend($('<i/>', { 'class': 'fa fa-paint-brush' }));
          }
        }
      });
    },

    toggleSelect: function(event) {
      event && event.stopPropagation();
      if (!this.model.get('_isSelected')) this.selectItem();
    },

    selectItem: function() {
      Origin.trigger('editor:theme:selected');
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

  return ThemeItemView;
});
