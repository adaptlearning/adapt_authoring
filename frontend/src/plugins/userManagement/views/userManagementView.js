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
    users: new UserCollection(),
    views: [],

    events: {
      'click button.refresh-all': 'refreshUserViews',
      'click button.view-mode': 'switchToViewMode',
      'click button.edit-mode': 'switchToEditMode'
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
      // don't want to render before we got da data
      if(!this.model.get('isReady') === true) {
        this.listenTo(this.model, 'change:isReady',this.render);
        return;
      }

      OriginView.prototype.render.apply(this, arguments);

      this.setHeight();
      this.switchToViewMode();
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

    onDataFetched: function(models, reponse, options) {
      this.model.set('isReady', true);
    }

  }, {
    template: 'userManagement'
  });

  return UserManagementView;
});
