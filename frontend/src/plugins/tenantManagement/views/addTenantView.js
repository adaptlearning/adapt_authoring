define(function (require) {

  var Origin = require("coreJS/app/origin");
  var Helpers = require("coreJS/app/helpers");
  var OriginView = require('coreJS/app/views/originView');

  var AddTenantView = OriginView.extend({
    tagName: 'div',
    className: 'addTenant',
    events: {},

    preRender: function () {
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.addnewtenant') });
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
        self.showErrorMessage(window.polyglot.t('app.addvalidtenantname'));
        return;
      }
      if (!displayName) {
        self.showErrorMessage(window.polyglot.t('app.addvalidtenantdisplayname'));
        return;
      }
      this.$('form.add-Tenant').ajaxSubmit({
        error: function (e) {
          self.showErrorMessage(e.responseText);
        },
        success: function (t) {
          self.showSuccessMessage('app.newtenant', 'app.addtenantsuccess');
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
        title: window.polyglot.t(titleMessage),
        text: window.polyglot.t(textMessage),
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
