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
      this.setValue(this.value);
      _.defer(this.postRender.bind(this));
      return this;
    },

    renderItem: function(item, escape) {
      var name = item.firstName && item.lastName ? escape(item.firstName  + ' ' +  item.lastName) : '';
      var email = escape(item.email);
      if(name) {
        return '<div><span class="name">' + name + '</span> <span class="email">&lt;' + email + '&gt;</span></div>'
      }
      return '<div><span class="name">' + email + '</span></div>';
    },

    postRender: function() {
      this.fetchUsers(this.initSelectize);
    },

    fetchUsers: function(callback) {
      $.get('/api/user')
        .done(callback.bind(this))
        .fail(function(error) {
          Origin.Notify.alert({ type: 'error', text: error });
        });
    },

    initSelectize: function(users) {
      this.$el.selectize({
        labelField: 'email',
        valueField: '_id',
        options: users,
        searchField: [ 'email', 'firstName', 'lastName' ],
        render: {
          item: this.renderItem,
          option: this.renderItem
        }
      });
    },

    getValue: function() {
      return this.$el.val();
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
