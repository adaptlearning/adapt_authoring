// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var InfoView = OriginView.extend({
    tagName: 'div',

    events: {
      'click .btn': 'onButtonClicked'
    },

    initialize: function(options) {
      OriginView.prototype.initialize.apply(this, arguments);
      this.model = new Backbone.Model();
    },

    preRender: function() {
      var self = this;
      this.getData('installed', function(data) {
        self.model.set('installed', data);
        self.render();
      });
    },

    updateButton: function(newLabel, animate) {
      var $btn = this.$('.btn');
      $btn.text(newLabel);
      if(animate === true) $btn.addClass('animate');
      else $btn.removeClass('animate');
    },

    getData: function(endRoute, cb) {
      var done = function(data, status) {
        if(status === 'error') {
          return Origin.Notify.alert({
            type: 'error',
            text: data.responseJSON.error
          });
        }
        if(Object.values(data).length === 1) {
          data = Object.values(data)[0];
        }
        cb(data);
      }
      $.getJSON(this.getRoutePrefix() + endRoute, done).fail(done);
    },

    getRoutePrefix: function() {
      return 'api/updater/' + this.route + '/';
    }
  }, {
    template: 'systemInfo'
  });

  return InfoView;
});
