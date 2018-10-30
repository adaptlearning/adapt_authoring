// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var Helpers = require('core/helpers');
  var UserCollection = require('../collections/userCollection');
  var UserModel = require('../models/userModel');
  var UserView = require('../views/userView');

  var UserManagementView = OriginView.extend({
    className: 'userManagement',
    settings: {
      autoRender: false
    },
    users: new UserCollection(),
    views: [],
    selectedView: null,

    events: {
      'click button.refresh-all': 'refreshUserViews',
      'click button[data-sort]': 'sortCollection',
      'click .reset-filter': 'resetFilter',
      'input .search-email': 'onSearchInput'
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);

      this.listenTo(this.users, 'sort', function(a,b,c) {
        this.removeChildViews();
        this.renderChildViews();
      });

      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.usermanagementtitle') });
      this.initData();
    },

    initData: function() {
      this.listenTo(this.users, 'sync', this.onDataFetched);
      this.users.fetch();
    },

    render: function() {
      this.removeChildViews();
      OriginView.prototype.render.apply(this, arguments);
      this.renderChildViews();
    },

    renderChildViews: function() {
      var fragment = document.createDocumentFragment();
      this.users.each(function(user) {
        user.set('globalData', this.model.get('globalData'));
        var userView = new UserView({model: user});
        fragment.appendChild(userView.el);
        this.views.push(userView);

        if(this.selectedView && user.get('_id') === this.selectedView) {
          userView.$el.addClass('selected').click();
        }

      }, this);
      this.$('.users').append(fragment);
    },

    removeChildViews: function() {
      if(this.views.length) {
        for(var i = 0, count = this.views.length; i < count; i++) {
          var view = this.views[i];
          if (view.isSelected) this.selectedView = view.model.get('_id');
          view.remove();
        }
        this.views = [];
      }
    },

    postRender: function() {
      this.setViewToReady();
      this.$('.users').fadeIn(300);
    },

    sortCollection: function(event) {
      var $elm = $(event.currentTarget);
      var sortBy = $elm.data('sort');
      var sortAscending = $elm.hasClass('fa-sort-down');

      if ($elm.hasClass('active')) {
        sortAscending = !sortAscending;
      }

      this.$('.sort').removeClass('active fa-sort-up').addClass('fa-sort-down');
      $elm.addClass('active');

      $elm.toggleClass('fa-sort-down', sortAscending);
      $elm.toggleClass('fa-sort-up', !sortAscending);

      this.users.sortBy = sortBy;
      this.users.direction = (sortAscending) ? 1 : -1;
      this.users.sortCollection();
    },

    onSearchInput: function(event) {
      var searchTerm = $(event.currentTarget).val();
      this.users.mailSearchTerm = searchTerm;
      this.users.sortCollection();
    },

    resetFilter: function() {
      this.$('.sort').removeClass('active fa-sort-up').addClass('fa-sort-down');
      this.users.sortBy = 'email';
      this.users.direction = 1;
      this.users.mailSearchTerm = false;
      this.$('.search-email').val('');
      this.$('.sort').removeClass('active fa-sort-up').addClass('fa-sort-down');
      this.$('button[data-sort="email"]').addClass('active');

      this.users.sortCollection();
    },

    refreshUserViews: function(event) {
      event && event.preventDefault();
      this.users.fetch();
      this.resetFilter();
    },

    onDataFetched: function(models, reponse, options) {
      this.render();
    }

  }, {
    template: 'userManagement'
  });

  return UserManagementView;
});
