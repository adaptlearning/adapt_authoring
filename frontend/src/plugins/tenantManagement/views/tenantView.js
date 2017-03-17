define(function(require) {
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var TenantView = OriginView.extend({
    tagName: 'div',
    className: function() {
      var className = 'tenant-item tb-row' + ' ' + this.model.get('_id');
      return className;
    },
    editMode: false,

    events: {
      'click a.edit': 'onEditClicked',
      'click a.save': 'onSaveClicked',
      'click a.cancel': 'onCancelClicked',

      'click button.disableTenant': 'onDisableTenantClicked',
      'click button.enableTenant': 'onEnableClicked'
    },

    preRender: function() {
      this.listenTo(this.model, 'change', this.onModelUpdated);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(this, 'remove', this.remove);
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);

      if (this.model.get('_isDeleted') === true) {
        this.$el.addClass('inactive');
      } else {
        this.$el.removeClass('inactive');
      }

      if (this.editMode === true) {
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

    onModelUpdated: function(model, options) {
      this.render();
      if (!options.status) {
        this.model.save(model.changedAttributes(), { patch: true });
      }
    },

    getColumnFromDiv: function(div) {
      return $(div).closest('.tb-col-inner');
    },

    getInputFromDiv: function(div) {
      return $('.input', this.getColumnFromDiv(div));
    },

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
      if (inputType === 'text' || inputType === 'email') {
        $input.val(this.model.get($input.attr('data-modelKey')));
      }
    },

    onSaveClicked: function(event) {
      event && event.preventDefault();

      var $column = this.getColumnFromDiv(event.currentTarget);
      this.disableFieldEdit($column);

      // save if not the same as old value
      var $input = this.getInputFromDiv($column);
      if ($input.val() && this.model.get($input.attr('data-modelKey')) !== $input.val()) {
        this.model.set($input.attr('data-modelKey'), $input.val());
      }
    },

    onCancelClicked: function(event) {
      event && event.preventDefault();
      this.disableFieldEdit(this.getColumnFromDiv(event.currentTarget));
    },

    onDisableTenantClicked: function(event) {
      var self = this;
      Origin.Notify.confirm({
        type: 'confirm',
        text: window.polyglot.t('app.disabletenantconfirm') + ' ' + this.model.get('name'),
        callback: function(confirmed) {
          if (confirmed) {
            self.disableTenant(event);
          }
        }
      });
    },

    disableTenant: function(event) {
      $.ajax({
        url: 'api/tenant/' + this.model.get("_id"),
        type: 'DELETE',
        success: function(result) {
          var disableId = event.currentTarget.id;
          var enableId = 'enable_' + disableId.split('_')[1];
          $('#' + disableId).addClass('display-none');
          $('#' + enableId).removeClass('display-none');
          Origin.Notify.alert({
            type: 'success',
            text: window.polyglot.t('app.disabletenantsuccess')
          });
        }
      });
    },

    onEnableClicked: function(event) {
      var self = this;
      Origin.Notify.confirm({
        type: 'confirm',
        text: window.polyglot.t('app.enabletenantconfirm') + ' ' + this.model.get('name'),
        callback: function(confirmed) {
          if (confirmed) {
            self.enableTenant(event);
          }
        }
      });
    },

    enableTenant: function(event) {
      $.ajax({
        url: 'api/tenant/' + this.model.get("_id"),
        type: 'PUT',
        data: { '_isDeleted': false },
        success: function(result) {
          var enableId = event.currentTarget.id;
          var disableId = 'disable_' + enableId.split('_')[1];
          $('#' + enableId).addClass('display-none');
          $('#' + disableId).removeClass('display-none');
          Origin.Notify.alert({
            type: 'success',
            text: window.polyglot.t('app.disabletenantsuccess')
          });
        }
      });
    }

  }, {
    template: 'tenant'
  });

  return TenantView;
});
