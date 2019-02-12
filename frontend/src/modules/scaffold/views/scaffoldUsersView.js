define([ 'core/origin', 'backbone-forms' ], function(Origin, BackboneForms) {
  var ScaffoldUsersView = Backbone.Form.editors.Base.extend({
    tagName: 'input',
    className: 'scaffold-users',
    idField: 'email',
    events: {
      'change': function() { this.trigger('change', this); },
      'focus': function() { this.trigger('focus', this); },
      'blur': function() { this.trigger('blur', this); }
    },

    render: function() {
      this.fetchUsers(this.initSelectize);
      return this;
    },

    renderItem: function(item, escape) {
      return Handlebars.templates.scaffoldUsersOption({
        name: item.firstName && item.lastName ? escape(item.firstName  + ' ' +  item.lastName) : false,
        email: escape(item.email),
        disabled: item.disabled
      });
    },

    fetchUsers: function(callback) {
      $.get('/api/user')
        .done(callback.bind(this))
        .fail(function(error) {
          Origin.Notify.alert({ type: 'error', text: error });
        });
    },

    initSelectize: function(users) {
      this.setValue(this.value);

      var meId = Origin.sessionModel.get('id');

      users.forEach(function(user) {
        if(user._id === meId) user.disabled = true;
      });

      this.$el.selectize({
        labelField: 'email',
        valueField: '_id',
        options: users,
        searchField: [ 'email', 'firstName', 'lastName' ],
        render: {
          item: this.renderItem,
          option: this.renderItem
        },
        onItemRemove: function(value, $item) {
          if(value !== Origin.sessionModel.get('id')) {
            return;
          }
          Origin.Notify.alert({
            type: 'warning',
            text: Origin.l10n.t('app.stopsharingwithyourself')
          });
          this.addItem(value, true);
          this.close();
        }
      });
    },

    getValue: function() {
      if(this.$el.val() === "") {
        return [];
      }
      return this.$el.val().split(',');
    },

    setValue: function(value) {
      this.$el.val(value);
    },

    focus: function() {
      if(!this.hasFocus) this.$el.focus();
    },

    blur: function() {
      if(this.hasFocus) this.$el.blur();
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('Users', ScaffoldUsersView);
  });

  return ScaffoldUsersView;

});
