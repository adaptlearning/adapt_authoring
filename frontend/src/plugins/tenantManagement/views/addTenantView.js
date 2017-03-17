define(function(require) {

  var Origin = require("coreJS/app/origin");
  var Helpers = require("coreJS/app/helpers");
  var OriginView = require('coreJS/app/views/originView');

  var AddTenantView = OriginView.extend({
    tagName: 'div',
    className: 'addTenant',
    events: {},

    preRender: function() {
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.addnewtenant') });
      this.listenTo(Origin, 'tenantManagement:saveTenant', this.saveNewTenant);
    },

    postRender: function() {
      this.setHeight();
      this.setViewToReady();
    },

    setHeight: function() {
      var newHeight = $(window).height() - $('div.' + this.className).offset().top - $(".sidebar-item-container").height();
      $('div.' + this.className).height(newHeight);
    },

    saveNewTenant: function(event) {
      var self = this;
      var name = this.$("#tenantName").val();
      var displayName = this.$("#tenantDisplayName").val();
      if (!name) {
        Origin.Notify.alert({
          type: 'error',
          title: "Please enter valid tenant name"
        });
        return;
      }
      if (!displayName) {
        Origin.Notify.alert({
          type: 'error',
          title: window.polyglot.t('app.addvalidtenantname')
        });
        return;
      }
      this.$('form.add-Tenant').ajaxSubmit({
        error: function(e) {
          Origin.Notify.alert({
            type: 'error',
            title: "",
            text: window.polyglot.t('app.errorcannotaddtenant')
          });
        },
        success: function(t) {
          Origin.Notify.alert({
            type: 'success',
            title: window.polyglot.t('app.newtenant'),
            text:  window.polyglot.t('app.addtenantsuccess'),
            callback: function() {
              self.goBack();
            }
          });
        }
      });
    },
    goBack: function() {
      Origin.router.navigate('#/tenantManagement', { trigger: true });
    }

  }, {
    template: 'addTenant'
  });

  return AddTenantView;
});
