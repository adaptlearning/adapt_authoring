define([
  'core/origin',
  'pikaday'
], function(Origin, Pikaday) {

  var FilterView = Backbone.View.extend({

    tagName: 'form',

    className: 'user-management-filter',

    events: {
      'change input[type="checkbox"],select': 'onFormChange',
      'input .search-email': 'onSearchInput'
    },

    initialize: function() {
      this.listenTo(Origin, 'remove:views', this.remove);

      this.render();
    },

    onSearchInput: function(event) {
      var searchTerm = $(event.currentTarget).val();
      this.collection.mailSearchTerm = searchTerm.toLowerCase();
      this.collection.sortCollection();
    },

    onFormChange: function() {
      var attributeMap = {};

      this.$('input:checked').each(function(index, input) {
        var name = input.name;
        var value = input.value;
        if (!attributeMap[name]) {
          attributeMap[name] = [];
        }
        attributeMap[name].push(value);
      });

      var tenantNames = this.tenantSelect.getValue();
      if (tenantNames.length) {
        attributeMap.tenantName = tenantNames;
      }

      this.collection.updateFilter(attributeMap);
    },

    remove: function() {
      this.tenantSelect && this.tenantSelect.destroy();
      Backbone.View.prototype.remove.apply(this, arguments);
    },

    render: function() {
      var template = Handlebars.templates['userManagementFilter'];
      this.$el.html(template({
        roles: this.model.get('globalData').allRoles.toJSON(),
        tenants: this.model.get('globalData').allTenants.toJSON()
      })).appendTo('.sidebar-item');
      _.defer(this.postRender.bind(this));
      return this;
    },

    postRender: function() {
      this.tenantSelect = this.$('[name="tenantName"]').selectize({
        maxItems: null
      })[0].selectize;
      this.tenantSelect.setValue('');
    },

    reset: function() {
      this.$('input[type="text"]').prop('disabled', false);
      this.collection.filterGroups = {};
      this.$('input[type="checkbox"]').prop('checked', false);
    }

  });

  return FilterView;

});
