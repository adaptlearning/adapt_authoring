// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var Helpers = require('../helpers.js');

  var UserView = OriginView.extend({
    tagName: 'div',
    className: function() {
      var className = 'user-item tb-row' + ' ' + this.model.get('_id');
      // 'current user styling
      if (this.model.get('_id') === Origin.sessionModel.get('id')) className += ' me';
      return className;
    },
    editMode: false,

    events: {
      'click a.edit': 'onEditClicked',
      'click a.save': 'onSaveClicked',
      'click a.cancel': 'onCancelClicked',

      'click a.resetLogins': 'onResetLoginsClicked',
      'click a.saveRoles': 'onSaveRoleClicked',

      'click button.changePassword': 'onChangePasswordClicked',
      'click button.disable': 'onDisableClicked',
      'click button.delete': 'onDeleteClicked',
      'click button.restore': 'onRestoreClicked'
    },

    preRender: function() {
      this.listenTo(this.model, 'change', this.onModelUpdated);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(this, 'remove', this.remove);
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);

      // disabled user styling
      if (this.model.get('_isDeleted') === true) {
        this.$el.addClass('inactive');
      } else {
        this.$el.removeClass('inactive');
      }

      if(this.editMode === true) {
        this.$('.edit-mode').removeClass('display-none');
        this.$('.write').addClass('display-none');
      } else {
        this.$('.edit-mode').addClass('display-none');
        this.$('.write').addClass('display-none');
      }
    },

    setEditMode: function() {
      this.editMode = true;
      this.render();
    },

    setViewMode: function() {
      this.editMode = false;
      this.render();
    },

    // utilities in case the classes change
    // TODO go back to eventData obj?
    getColumnFromDiv: function(div) { return $(div).closest('.tb-col-inner'); },
    getInputFromDiv: function(div) { return $('.input', this.getColumnFromDiv(div)); },

    disableFieldEdit: function(div) {
      $('.read', div).removeClass('display-none');
      $('.write', div).addClass('display-none');
    },

    enableFieldEdit: function(div) {
      $('.read', div).addClass('display-none');
      $('.write', div).removeClass('display-none').children('input').focus();
    },

    onEditClicked: function(event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);

      // disable any existing inputs first
      this.disableFieldEdit(this.$el);
      this.enableFieldEdit($column);
      var $input = this.getInputFromDiv($column);
      var inputType = $input.attr('type');
      if(inputType === "text" || inputType === "email") {
        $input.val(this.model.get($input.attr('data-modelKey')));
      }
    },

    onSaveClicked: function(event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);
      this.disableFieldEdit($column);

      // save if not the same as old value
      var $input = this.getInputFromDiv($column);
      if($input.val() && this.model.get($input.attr('data-modelKey')) !== $input.val()) {
        this.model.set($input.attr('data-modelKey'), $input.val());
      }
    },

    onCancelClicked: function(event) {
      event && event.preventDefault();
      this.disableFieldEdit(this.getColumnFromDiv(event.currentTarget));
    },

    onSaveRoleClicked: function(event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);
      var $input = this.getInputFromDiv($column);
      var oldRole = this.model.get('roles')[0];
      var newRole = $input.val();

      this.disableFieldEdit($column);

      var self = this;
      if(newRole && this.model.get($input.attr('data-modelKey')) !== newRole) {
        Helpers.ajax('api/role/' + oldRole + '/unassign/' + this.model.get('_id'), null, 'POST', function() {
          Helpers.ajax('api/role/' + newRole + '/assign/' + self.model.get('_id'), null, 'POST', function() {
            self.model.fetch();
          });
        });
      }
    },

    onResetLoginsClicked: function() {
      var self = this;
      Origin.Notify.confirm({
        text: 'Reset failed login attempts for <br/><b>' + this.model.get('email') + '</b>?',
        callback: function(confirmed) {
          if(confirmed) self.model.set('failedLoginCount', 0);
        }
      });
    },

    onChangePasswordClicked: function() {
      var self = this;
      Origin.Notify.confirm({
        type: 'input',
        title: 'Change password',
        text: 'Enter a new password for<br/><b>' + this.model.get('email') + '</b>',
        inputType: 'password',
        confirmButtonText: 'Save',
        closeOnConfirm: false,
        callback: function(newPassword) {
          if(newPassword === false) return;
          else if(newPassword === "") return swal.showInputError("You need to write something!");
          Helpers.ajax('/api/user/resetpassword', { "email": self.model.get('email'), "password": newPassword }, 'POST', function() {
            swal.close();
            self.model.fetch();
          });
        }
      });
    },

    onDisableClicked: function() {
      this.model.set('_isDeleted', true);
    },

    onRestoreClicked: function() {
      this.model.set('_isDeleted', false);
    },

    onDeleteClicked: function() {
      var self = this;
      Origin.Notify.confirm({
        type: 'confirm',
        text: 'Deleting <br/><b>' + this.model.get('email') + '</b>.<br/><br/> This is a one-way trip. Continue?',
        callback: function(confirmed) {
          if(confirmed) {
            self.model.destroy({
              error: function(error) {
                Origin.Notify.alert({
                  type: 'error',
                  text: error
                });
              }
            });
          }
        }
      });
    },

    onModelUpdated: function(model, options) {
      this.render();
      // don't save again on server update
      if(!options.status) {
        // console.log(model.get('email') + ':',JSON.stringify(model.changedAttributes(),null,' '));
        this.model.save(model.changedAttributes(), { patch: true });
      }
    }
  }, {
    template: 'user'
  });

  return UserView;
});
