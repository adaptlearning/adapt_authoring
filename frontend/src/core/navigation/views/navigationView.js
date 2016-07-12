// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var NavigationView = OriginView.extend({

    tagName: 'nav',

    className: 'navigation',

    initialize: function() {
      this.listenTo(Origin, 'login:changed', this.loginChanged);
      this.render();
    },

    events: {
      'click a.navigation-item':'onNavigationItemClicked',
      'click button.revert-loginas':'onRevertLoginas'
    },

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      return this;
    },

    loginChanged: function() {
      this.render();
    },

    onRevertLoginas: function() {
      var sessionModel = Origin.sessionModel;
      // back up of the seesion
      var _revertLogin = sessionModel.get('_revertLogin');
      $.ajax({
        method: 'post',
        url: '/api/loginas',
        data: {email: _revertLogin.email},
        success: function (jqXHR, textStatus, errorThrown) {
          sessionModel.set('_canRevert', false);
          sessionModel.set('id', jqXHR.id);
          sessionModel.set('tenantId', jqXHR.tenantId);
          sessionModel.set('email', jqXHR.email);
          sessionModel.set('isAuthenticated', jqXHR.success);
          sessionModel.set('permissions', jqXHR.permissions);
          delete sessionModel._revertLogin;
          Origin.trigger('login:changed');
          Origin.trigger('globalMenu:refresh');
          Origin.router.navigate('#/dashboard', {trigger: true});
        },
        failure: function (err) {
          Origin.Notify.alert({
            type: 'error',
            text: window.polyglot.t('app.errorlogginginas')
          });
        }
      });
    },

    onNavigationItemClicked: function(event) {
      event.preventDefault();
      event.stopPropagation();
      Origin.trigger('navigation:' + $(event.currentTarget).attr('data-event'));
    }

  }, {
    template: 'navigation'
  });

  return NavigationView;

});
