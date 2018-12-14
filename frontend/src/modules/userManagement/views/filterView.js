define([
  'core/origin',
  'libraries/pikaday/js/pikaday'
], function(Origin, Pikaday) {

  var FilterView = Backbone.View.extend({

    attributes: function() {
      return {
        style: 'display: none;'
      }
    },

    startDate: null,
    endDate: null,

    className: 'user-management-filter',

    events: {
      'change input[type="checkbox"],select': 'onFormChange',
      'click button[data-resetdate]': 'resetDate'
    },

    initialize: function(options) {
      this.listenTo(Origin, 'remove:views', this.remove);
      this.render();
    },

    getGroups: function() {
      return [{
        name: Origin.l10n.t('app.tenant'),
        key: 'tenantName',
        items: this.collection.filterGroups.tenantName
      },
      {
        name: Origin.l10n.t('app.role'),
        key: 'roleNames',
        items: this.collection.filterGroups.roleNames
      },
      {
        name: Origin.l10n.t('app.failedlogins'),
        key: 'failedLoginCount',
        items: this.collection.filterGroups.failedLoginCount
      }];
    },

    onFormChange: function() {
      var attributeMap = {
        startDate: this.startDate,
        endDate: this.endDate
      };

      var selected = this.$('form').find('input:checked').each(function(index, input) {
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

      if (attributeMap.lastAccess && attributeMap.lastAccess[0] === 'never') {
        attributeMap.startDate = null;
        attributeMap.endDate = null;
        this.$('input[type="text"]').prop('disabled', true);
      } else {
        this.$('input[type="text"]').prop('disabled', false);
      }
      this.collection.updateFilter(attributeMap);
    },

    remove: function() {
      this.tenantSelect.destroy();
      this.startPicker.destroy();
      this.endPicker.destroy();
      Backbone.View.prototype.remove.apply(this, arguments);
    },

    render: function() {
      var template = Handlebars.templates['userManagementFilter'];
      this.$el.html(template({groups: this.getGroups()}));
      _.defer(this.postRender.bind(this));
      return this;
    },

    onStartSelect: function(date) {
      this.startDate = date;
      this.startPicker.setStartRange(date);
      this.endPicker.setStartRange(date);
      this.endPicker.setMinDate(date);
      this.startDate.setHours(0, 0, 0);
      this.onFormChange();
    },

    onEndSelect: function(date) {
      this.endDate = date;
      this.startPicker.setEndRange(date);
      this.startPicker.setMaxDate(date);
      this.endPicker.setEndRange(date);
      this.endDate.setHours(23, 59, 59);
      this.onFormChange();
    },

    postRender: function() {
      this.tenantSelect = this.$('[name="tenantName"]').selectize({
        maxItems: null
      })[0].selectize;
      this.tenantSelect.setValue('');

      this.startPicker = new Pikaday({
        field: this.$('input[name="start-date"]')[0],
        onSelect: this.onStartSelect.bind(this)
      });
      this.endPicker = new Pikaday({
        field: this.$('input[name="end-date"]')[0],
        onSelect: this.onEndSelect.bind(this)
      });
    },

    resetDate: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var type = $(event.currentTarget).attr('data-resetdate');
      if (type === 'start') {
        this.startPicker.setDate(null);
        this.startDate = null;
      } else if (type === 'end') {
        this.endPicker.setDate(null);
        this.endDate = null;
      }
      this.onFormChange();
    },

    reset: function() {
      this.startPicker.setDate(null);
      this.startDate = null;
      this.endPicker.setDate(null);
      this.endDate = null;
      this.$('input[type="text"]').prop('disabled', false);
      this.collection.filterGroups = {};
      this.$('input[type="checkbox"]').prop('checked', false);
    }

  });

  return FilterView;

});
