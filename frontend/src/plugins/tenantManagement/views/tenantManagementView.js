define(function(require) {
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var tenantCollection = require('../collections/tenantCollection.js');
  var TenantView = require('../views/tenantView.js');
  var Helpers = require('coreJS/app/helpers');

  var TenantManagementView = OriginView.extend({

    tagName: 'div',

    className: 'tenantManagement',
    tenants: new tenantCollection(),
    views: [],
    events: {
      'click button.refresh-all': 'refreshTenantViews',
      'click button.view-mode': 'switchToViewMode',
      'click button.edit-mode': 'switchToEditMode'
    },
    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.tenantmanagement') });
      this.initData();
    },

    initData: function() {
      this.totalSpace = 0;
      this.listenTo(this.tenants, 'sync', this.onTenantsFetched);
      this.tenants.fetch();
    },

    preRender: function() {
      this.$el.fadeOut(0);
    },

    render: function() {
      if (!this.model.get('isReady') === true) {
        this.listenTo(this.model, 'change:isReady', this.render);
        return;
      }

      OriginView.prototype.render.apply(this, arguments);

      this.setHeight();
      this.switchToViewMode();
      this.renderTenantViews();
    },

    setHeight: function() {
      var newHeight = $(window).height() - $('.' + this.className).offset().top - $(".sidebar-item-container").height();
      $('.' + this.className).height(newHeight);
    },

    postRender: function() {
      this.setViewToReady();
    },

    refreshTenantViews: function(event) {
      event && event.preventDefault();
      this.tenants.fetch();
    },

    renderTenantViews: function() {
      this.$('.tenants').empty();

      var isEditMode = this.model.get('isEditMode');
      this.tenants.each(function(tenantModel, index) {

        tenantModel.set('globalData', this.model.get('globalData'));
        var uv = new TenantView({ model: tenantModel });
        this.$('.tenants').append(uv.$el.addClass('tb-row-' + Helpers.odd(index)));
        this.views.push(uv);

      }, this);
    },

    switchToViewMode: function(event) {
      event && event.preventDefault();

      this.model.set('isEditMode', false);
      this.$('button.view-mode').addClass('display-none');
      this.$('button.edit-mode').removeClass('display-none');

      _.each(this.views, function(view) { view.setViewMode(); });
    },

    switchToEditMode: function(event) {
      event && event.preventDefault();

      this.model.set('isEditMode', true);
      this.$('button.view-mode').removeClass('display-none');
      this.$('button.edit-mode').addClass('display-none');

      _.each(this.views, function(view) { view.setEditMode(); });
    },

    onTenantsFetched: function(models, reponse, options) {
      var self = this;
      this.addTenantSpaceDetails(function() {
        self.model.set('isReady', true);
      });
    },

    addTenantSpaceDetails: function(callback) {
      var self = this;
      var tenants = this.tenants.models;
      var totalOccupiedSpace = 0;
      $.ajax({
        url: '/space',
        method: 'GET',
        success: function(spaceList) {
          spaceList.forEach(function(space, index) {
            var tenant = _.where(tenants,{id:space.tenant})[0];
            if(tenant){
             var totalSize = self.convertByteToMb(space.totalSize);
             tenant.set('totalSize', totalSize + " MB");
             tenant.set('diskSize', self.convertByteToMb(space.diskSize) + " MB");
             tenant.set('databaseSize', space.databaseSize + " BYTES");
             totalOccupiedSpace += totalSize;
           }
           if(index===spaceList.length-1){
             self.model.set('totalOccupiedSpace',totalOccupiedSpace);
             callback();
           }
         });
        },
        error: function(e) {
          console.log("Unable to fetch spaces of tenants");
        }
      });
    },

    convertByteToMb: function(bytes) {
      var mb = bytes / (1024 * 1024);
      return Math.round(mb);
    }

  }, {
    template: 'tenantManagement'
  });
  return TenantManagementView;
});
