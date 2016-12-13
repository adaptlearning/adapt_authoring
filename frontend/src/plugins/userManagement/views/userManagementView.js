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

    render: function() {
      var SELECTED_CLASS = 'selected';
      var $selected = this.$('.user-item.' + SELECTED_CLASS)[0];

      OriginView.prototype.render.apply(this, arguments);
      this.$('.users').fadeOut(0);

      this.users.each(this.createUserView, this);
      this.setHeight();

      if($selected) {
        var selector = $selected.className.replace(SELECTED_CLASS,'');
        $(document.getElementsByClassName(selector)).addClass(SELECTED_CLASS).click();
      }
    },

    setHeight: function() {
      var newHeight = $(window).height()-$('.'+this.className).offset().top;
      $('.'+this.className).height(newHeight);
    },

    postRender: function() {
      this.setViewToReady();
      this.$('.users').fadeIn(300);
    },

    refreshUserViews: function(event) {
      event && event.preventDefault();
      this.users.fetch();
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
