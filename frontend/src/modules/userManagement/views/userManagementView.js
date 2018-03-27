// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');
  var UserCollection = require('../collections/userCollection');
  var UserModel = require('../models/userModel');
  var UserView = require('../views/userView');

  var UserManagementView = OriginView.extend({
    tagName: 'div',
    className: 'userManagement',
    settings: {
      autoRender: false
    },
    users: new UserCollection(),
    views: [],

    events: {
      'click button.refresh-all': 'refreshUserViews'
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);

      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.usermanagementtitle') });
      this.initData();
    },

    initData: function() {
      this.listenTo(this.users, 'sync', this.onDataFetched);
      this.fetchUsers();
    },

    render: function() {
      var selectedId;
      // remove the old views
      if(this.views.length) {
        for(var i = 0, count = this.views.length; i < count; i++) {
          var view = this.views[i];
          if(view.isSelected) selectedId = view.model.get('_id');
          view.remove();
        }
        this.views = [];
      }

      OriginView.prototype.render.apply(this, arguments);

      this.users.each(function(user) {
        var view = this.createUserView(user);
        if(user.get('_id') === selectedId) {
          view.$el.addClass('selected').click();
        }
      }, this);
    },

    postRender: function() {
      this.setViewToReady();
      this.$('.users').fadeIn(300);
    },

    fetchUsers: function () {
      if (this.model.get('globalData').hasSuperAdminPermissions) {
        this.users.fetch();
      } else if (this.model.get('globalData').hasTenantAdminPermissions) {
        this.users.fetch({ url: 'api/user/tenant', data: $.param({ _tenantId: Origin.sessionModel.get('tenantId') }) });
      }
    },

    refreshUserViews: function(event) {
      event && event.preventDefault();
      this.fetchUsers();
    },

    createUserView: function(model) {
      model.set('globalData', this.model.get('globalData'));
      var uv = new UserView({ model:model });
      this.$('.users').append(uv.$el);
      this.views.push(uv);
      return uv;
    },

    onDataFetched: function(models, reponse, options) {
      this.render();
    }

  }, {
    template: 'userManagement'
  });

  return UserManagementView;
});
