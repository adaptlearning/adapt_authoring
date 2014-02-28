define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ProfileView = Backbone.View.extend({

    tagName: "div",

    className: "profile",

    events: {
      'blur input': 'inputBlur',
      'click button': 'buttonClick'
    },

    render: function() {
    var template = Handlebars.templates.profile,
        profileview = this;

      //not great but the fetch can take a while http://stackoverflow.com/questions/9250523/how-to-wait-to-render-view-in-backbone-js-until-fetch-is-complete
      this.model.fetch().complete(function(){
        profileview.$el.html(template(profileview.model.toJSON()));
      });

      return this;
    },

    inputBlur: function (ev) {
      var $el = $(ev.target);

      switch( $el.attr('id') ) {
          case 'profileViewInputPassword':
            //@todo : regex that thang
          break;
          case 'profileViewConfirmPassword':
            var val = $.trim($el.val());

            if( val !== ''){
              //grab and trim the password field value
              oval = $.trim( this.$el.find('#inputPassword').val() );

              if( val === oval ){
                $el.parent('.form-group').addClass('has-success');
              } else {
                $el.parent('.form-group').addClass('has-error');
              }
            } else {
              //empty string
              $el.parent('.form-group').addClass('has-warning');
            }
          break;
      }
    },

    buttonClick: function (ev) {
      var $el = $(ev.target);

      ev.preventDefault();

      switch( $el.attr('id') ){
        case 'profileViewSubmitBtn':

          //@todo : proper validation of the password
          var newval = {};

          newval.password = $.trim( this.$el.find('#inputPassword').val() );
          //this.model.set('password', $.trim( this.$el.find('#inputPassword').val() ));

          this.model.save(newval,{
            error: function (model, xhr, options){
              alert('error saving');
            },
            success: function (model, response, options){
              alert('yay changed');
            }
          });
        break;
        case 'profileViewCancelBtn':
          Backbone.history.navigate('/dashboard', {trigger: true});
        break;
      }
    }

  },
  {
    template: 'profile'
  });

  return ProfileView;

});