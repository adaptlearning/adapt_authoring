// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');

  var MultipleUserView = OriginView.extend({
    className: 'user-item',

    events: {
      'click button.remove': 'onRemoveClicked'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
    },

    postRender: function() {
      this.$('input[data-modelKey=email]').focus();
    },

    onRemoveClicked: function(e) {
      e && e.preventDefault();
      this.trigger('remove', this);
    }
  }, {
    template: 'multipleUser'
  });

  return MultipleUserView;
});
