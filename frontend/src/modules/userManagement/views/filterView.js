define([
  'core/origin'
], function(Origin) {

  var FilterView = Backbone.View.extend({

    className: 'user-management-filter',

    events: {
      'click .back-drop': 'remove',
      'click form': 'onFormClick',
      'change form': 'onFormChange'
    },

    initialize: function(options) {
      this.listenTo(Origin, 'remove:views', this.remove);

      this.items = [];
      this.users = options.users;
      this.type = options.type;

      options.groups.forEach(function(option) {
        var item = {
          name: option,
          selected: false
        }
        if (options.selected.indexOf(option) >= 0) {
          item.selected = true;
        }
        this.items.push(item);
      }, this);
      this.render();
    },

    render: function() {
      var template = Handlebars.templates['userManagementFilter'];
      this.$el.html(template({items: this.items}));
      return this;
    },

    onFormChange: function(event) {
      var selected = this.$('input:checked').map(function(index, elm) {
        return elm.value;
      }).get();
      this.users.trigger('filterUpdate', this.type, selected);
    },

    onFormClick: function(event) {
      event.stopPropagation();
    }

  });

  return FilterView;

});
