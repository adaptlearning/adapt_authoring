define(function (require) {
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var TenantView = OriginView.extend({
    tagName: 'div',
    className: function () {
      var className = 'tenant-item tb-row' + ' ' + this.model.get('_id');
      return className;
    },
    isSelected: false,

    events: {
      'click': 'onClicked',
      'click a.edit': 'onEditClicked',
      'click a.save': 'onSaveClicked',
      'click a.cancel': 'onCancelClicked',

      'click button.disableTenant': 'onDisableTenantClicked',
      'click button.enableTenant': 'onEnableClicked'
    },

    preRender: function () {
      this.listenTo(Origin, 'tenantManagement:tenant:reset', this.resetView);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(this, 'remove', this.remove);
    },

    render: function () {
      OriginView.prototype.render.apply(this, arguments);
      this.applyStyles();
    },

    applyStyles: function () {
      this.$el.toggleClass('inactive', this.model.get('_isDeleted') === true)
        .toggleClass('selected', this.isSelected);

      this.$('.edit-mode').toggleClass('display-none', !this.isSelected);
      this.$('.write').addClass('display-none');
    },

    resetView: function () {
      if (this.isSelected) {
        this.isSelected = false;
        this.applyStyles();
      }
    },

    setEditMode: function () {
      this.editMode = true;
      this.applyStyles();
    },

    setViewMode: function () {
      this.editMode = false;
      this.applyStyles();
    },

    getColumnFromDiv: function (div) {
      return $(div).closest('.tb-col-inner');
    },

    getInputFromDiv: function (div) {
      return $('.input', this.getColumnFromDiv(div));
    },

    disableFieldEdit: function (div) {
      $('.read', div).removeClass('display-none');
      $('.write', div).addClass('display-none');
    },

    enableFieldEdit: function (div) {
      $('.read', div).addClass('display-none');
      $('.write', div).removeClass('display-none').children('input').focus();
    },

    onEditClicked: function (event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);

      // disable any existing inputs first
      this.disableFieldEdit(this.$el);
      this.enableFieldEdit($column);
      var $input = this.getInputFromDiv($column);
      var inputType = $input.attr('type');
      if (inputType === 'text' || inputType === 'email') {
        $input.val(this.model.get($input.attr('data-modelKey')));
      }
    },

    onClicked: function (event) {
      if (!this.isSelected) {
        Origin.trigger('tenantManagement:tenant:reset');
        this.isSelected = true;
        this.applyStyles();
      }
    },

    onSaveClicked: function (event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);
      this.disableFieldEdit($column);

      // save if not the same as old value
      var $input = this.getInputFromDiv($column);
      if ($input.val() && this.model.get($input.attr('data-modelKey')) !== $input.val()) {
        this.updateModel($input.attr('data-modelKey'), $input.val());
      }
    },

    onCancelClicked: function (event) {
      event && event.preventDefault();
      this.disableFieldEdit(this.getColumnFromDiv(event.currentTarget));
    },

    onDisableTenantClicked: function (event) {
      var self = this;
      Origin.Notify.confirm({
        type: 'confirm',
        text: window.polyglot.t('app.disabletenantconfirm') + ' ' + this.model.get('name'),
        callback: function (confirmed) {
          if (confirmed) {
            self.disableTenant(event);
          }
        }
      });
    },

    disableTenant: function (event) {
      this.updateModel('_isDeleted', true);
    },

    onEnableClicked: function (event) {
      var self = this;
      Origin.Notify.confirm({
        type: 'confirm',
        text: window.polyglot.t('app.enabletenantconfirm') + ' ' + this.model.get('name'),
        callback: function (confirmed) {
          if (confirmed) {
            self.enableTenant(event);
          }
        }
      });
    },

    enableTenant: function (event) {
      this.updateModel('_isDeleted', false);
    },

    updateModel: function (key, value) {
      var self = this;
      var toSave = {};
      toSave[key] = value;
      this.model.save(toSave, {
        patch: true,
        wait: true,
        success: function () {
          Origin.trigger('tenantManagement:tenant:reset');
        },
        error: function (err) {
          return self.onError(window.polyglot.t('app.updatetenanterror'));
        }
      });
    },

    onError: function (error) {
      Origin.Notify.alert({
        type: 'error',
        text: error.message || error
      });
    }
  }, {
      template: 'tenant'
    });

  return TenantView;
});
