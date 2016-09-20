// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var ServerLogView = OriginView.extend({
    tagName: 'div',
    className: 'serverLog',

    preRender: function() {
      this.listenTo(this.model, 'change:appliedFilters', this.filter);

      this.model.set('appliedFilters', ['info','error']);
      this.model.set('logsToRender', this.model.get('logs').models);

      this.listenTo(Origin, 'serverLog:filter:on', this.filterOn);
      this.listenTo(Origin, 'serverLog:filter:off', this.filterOff);
    },

    postRender: function() {
      // go back to the top
      this.$el.scrollTop(0);

      this.setHeight();
      this.setViewToReady();
    },

    setHeight: function() {
      var newHeight = $(window).height()-$('.' + this.className).offset().top;
      $('.' + this.className).height(newHeight);
    },

    filterOn: function(filterType) {
      if(!_.contains(this.model.get('appliedFilters'), filterType)) {
        var temp = this.model.get('appliedFilters').slice(0);
        temp.push(filterType);
        this.model.set('appliedFilters', temp);
      }
    },

    filterOff: function(filterType) {
      var filters = this.model.get('appliedFilters').slice(0);
      filters.splice(filters.indexOf(filterType),1);
      this.model.set('appliedFilters', filters);
    },

    filter: function() {
      var filters = this.model.get('appliedFilters');
      var sorted = this.model.get('logs').filter(function(item) {
        return _.contains(filters, item.get('level'));
      });

      this.model.set('logsToRender', sorted);

      this.render();
    }
  }, {
    template: 'serverLog'
  });

  return ServerLogView;
});
