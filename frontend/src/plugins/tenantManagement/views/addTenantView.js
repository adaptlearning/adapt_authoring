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
        alert("Name required" + name);
        return;
      }
      if (!displayName) {
        alert("Display Name Required" + displayName);
        return;
      }
      this.$('form.add-Tenant').ajaxSubmit({
        error: function(e) {
          alert("Unable to add Tenant");
        },
        success: function(t) {
          Origin.Notify.alert({
            type: 'success',
            title: "New Tenant",
            text: "Tenant added successfully!",
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
