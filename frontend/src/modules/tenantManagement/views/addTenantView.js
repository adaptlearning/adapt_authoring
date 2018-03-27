define(function (require) {

  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var AddTenantView = OriginView.extend({
    tagName: 'div',
    className: 'addTenant',
    events: {},

    preRender: function () {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.addnewtenant') });
      this.listenTo(Origin, 'tenantManagement:saveTenant', this.saveNewTenant);
    },

    postRender: function () {
      this.setHeight();
      this.setViewToReady();
    },

    setHeight: function () {
      var newHeight = $(window).height() - $('div.' + this.className).offset().top - $(".sidebar-item-container").height();
      $('div.' + this.className).height(newHeight);
    },

    saveNewTenant: function (event) {
      var self = this;
      var name = this.$("#tenantName").val();
      var displayName = this.$("#tenantDisplayName").val();
      if (!name) {
        self.showErrorMessage(Origin.l10n.t('app.addvalidtenantname'));
        return;
      }
      if (!displayName) {
        self.showErrorMessage(Origin.l10n.t('app.addvalidtenantdisplayname'));
        return;
      }
      this.$('form.add-Tenant').ajaxSubmit({
        error: function (e) {
          self.showErrorMessage(e.responseText);
        },
        success: function (t) {
          self.showSuccessMessage('app.newtenant', 'app.addtenantsuccess');
          Origin.trigger('tenantManagement:newtenant',t);
        }
      });
    },

    goBack: function () {
      Origin.router.navigate('#/tenantManagement', { trigger: true });
    },

    showErrorMessage: function (message) {
      Origin.Notify.alert({
        type: 'error',
        title: message
      });
    },

    showSuccessMessage: function (titleMessage, textMessage) {
      var self = this;
      Origin.Notify.alert({
        type: 'success',
        title: Origin.l10n.t(titleMessage),
        text: Origin.l10n.t(textMessage),
        callback: function () {
          self.goBack();
        }
      });
    }

  }, {
      template: 'addTenant'
    });

  return AddTenantView;
});
