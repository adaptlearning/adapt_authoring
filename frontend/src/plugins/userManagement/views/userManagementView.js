// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var Helpers = require('coreJS/app/helpers');
  var UserCollection = require('../collections/userCollection.js');
  var UserModel = require('../models/userModel.js');
  var UserView = require('../views/userView.js');

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

      Origin.trigger('location:title:update', { title: window.polyglot.t('app.usermanagementtitle') });
      this.initData();
    },

    initData: function() {
      this.listenTo(this.users, 'sync', this.onDataFetched);
      this.users.fetch();
    },

    preRender: function() {
      this.$el.fadeOut(0);
    },

    render: function() {
      OriginView.prototype.render.apply(this, arguments);

      this.setHeight();
      this.renderUserViews();
    },

    setHeight: function() {
      var newHeight = $(window).height()-$('.'+this.className).offset().top;
      $('.'+this.className).height(newHeight);
    },

    postRender: function() {
      this.$el.fadeIn(1000);
      this.setViewToReady();
    },

    refreshUserViews: function(event) {
      event && event.preventDefault();
      this.users.fetch();
    },

    renderUserViews: function() {
      this.$('.users').empty();

      var isEditMode = this.model.get('isEditMode');
      this.users.each(function(userModel, index) {
        userModel.set('globalData', this.model.get('globalData'));
        var uv = new UserView({ model:userModel });
        this.$('.users').append(uv.$el.addClass('tb-row-' + Helpers.odd(index)));
        this.views.push(uv);
      }, this);
    },

    onDataFetched: function(models, reponse, options) {
      this.render();
    }

  }, {
    template: 'userManagement'
  });

  return UserManagementView;
});
