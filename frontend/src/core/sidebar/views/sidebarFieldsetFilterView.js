// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var Backbone = require('backbone');

  var SidebarFieldsetFilterView = Backbone.View.extend({
    className: 'sidebar-row',

    events: {
      'click button': 'toggleFilter'
    },

    initialize: function() {
      this.listenTo(Origin, 'remove:views', this.remove);
      this.render();
    },

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];

      this.$el.html(template(data));

      this.postRender();

      return this;
    },

    postRender: function() {
      // HACK for #1184. Sure there must be a better way to turn on.
      this.toggleFilter();
    },

    toggleFilter: function() {
      var shouldBeSelected = !this.model.get('_isSelected');

      this.model.set('_isSelected', shouldBeSelected);
      this.$('i').toggleClass('fa-toggle-on', shouldBeSelected);

      Origin.trigger('sidebarFieldsetFilter:filterForm', this.model.get('legend'));
    }
  }, {
    template: 'sidebarFieldsetFilter'
  });

  return SidebarFieldsetFilterView;
});
