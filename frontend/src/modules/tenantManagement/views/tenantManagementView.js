define(function (require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');
  var tenantCollection = require('../collections/tenantCollection');
  var TenantView = require('../views/tenantView');

  var TenantManagementView = OriginView.extend({
    tagName: 'div',
    className: 'tenantManagement',
    settings: {
      autoRender: false
    },
    tenants: new tenantCollection(),
    views: [],
    events: {
      'click button.refresh-all': 'refreshTenantViews',
    },
    initialize: function () {
      OriginView.prototype.initialize.apply(this, arguments);
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.tenantmanagement') });
      this.initData();
    },

    initData: function () {
      this.listenTo(this.tenants, 'sync', this.onTenantsFetched);
      this.tenants.fetch();
    },

    render: function () {
      var SELECTED_CLASS = 'selected';
      var $selected = this.$('.tenant-item.' + SELECTED_CLASS)[0];

      OriginView.prototype.render.apply(this, arguments);
      this.$('.tenants').fadeOut(0);

      this.switchToViewMode();
      this.renderTenantViews();
      this.setHeight();
    },

    setHeight: function () {
      var newHeight = $(window).height() - $('.' + this.className).offset().top - $(".sidebar-item-container").height();
      $('.' + this.className).height(newHeight);
    },

    postRender: function () {
      this.setViewToReady();
      this.$('.tenants').fadeIn(300);
    },

    refreshTenantViews: function (event) {
      event && event.preventDefault();
      this.tenants.fetch();
    },

    renderTenantViews: function () {
      this.$('.tenants').empty();

      var isEditMode = this.model.get('isEditMode');
      this.tenants.each(function (tenantModel, index) {

        tenantModel.set('globalData', this.model.get('globalData'));
        var tv = new TenantView({ model: tenantModel });
        this.$('.tenants').append(tv.$el.addClass('tb-row-' + Helpers.odd(index)));
        this.views.push(tv);
        return tv;
      }, this);
    },

    switchToViewMode: function (event) {
      event && event.preventDefault();

      this.model.set('isEditMode', false);
      _.each(this.views, function (view) { view.setViewMode(); });
    },

    switchToEditMode: function (event) {
      event && event.preventDefault();

      this.model.set('isEditMode', true);
      _.each(this.views, function (view) { view.setEditMode(); });
    },

    onTenantsFetched: function (models, reponse, options) {
      var self = this;
      this.render();
    }

  }, {
      template: 'tenantManagement'
    });
  return TenantManagementView;
});
