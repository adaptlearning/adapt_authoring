define(function (require) {
    var Origin = require('core/origin');
    var UserInfoModel = require('./models/userInfoModel');
    console.log(Origin.Notify);

    Origin.once('origin:dataReady login:changed', function(){
        var user = new UserInfoModel();
        user.fetch({
            success: function () {
                var text = $('html').attr('lang') === 'en' ? 'Please <a href="#user/profile">change your password</a>! This message will be dismissed once it is changed.' : 'Veuillez <a href="#user/profile">changer votre mot de passe</a>! Ce message cessera lorsque vous aurez changé votre mot de passe';
                if(user.attributes.lastPasswordChange){
                    var policyChange = new Date('2023-06-26T01:12:06.510Z')
                    var changeDate = new Date(user.attributes.lastPasswordChange)
                    if((changeDate > policyChange)){
                       Origin.Notify.alert({
                        type: 'warning',
                        text: text
                      });
                    }
                } else {
                    Origin.Notify.alert({
                        type: 'warning',
                        text: text
                      });
                }
            }
        });
    })
})
  