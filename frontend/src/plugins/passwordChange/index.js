define(function (require) {
    var Origin = require('core/origin');
    var UserInfoModel = require('./models/userInfoModel');
    var PasswordFieldsView = require('./views/passwordFieldsView');

    console.log(PasswordFieldsView);

    Password = Backbone.Model.extend({
        defaults: {
            fieldId: 'password'
        }
    });

    Origin.once('origin:dataReady login:changed location:change', function () {
        var user = new UserInfoModel();
        user.fetch({
            success: function () {
                var model = new Password();
                var passwordFieldsView = new PasswordFieldsView({model: model}).render();
                console.log(passwordFieldsView);
                function openPopup(){
                    Origin.Notify.alert({
                        type: 'warning',
                        html: passwordFieldsView.el,
                        showConfirmButton: true,
                        confirmButtonText: 'Go to Profile',
                        showCancelButton: false,
                        callback: function (isConfirm) {
                            console.log(passwordFieldsView.$el.find('#password')[0].value);
                            console.log(passwordFieldsView.$el.find('#confirmPassword')[0].value);
                            console.log(isConfirm);
                            if (isConfirm) {
                                Origin.router.navigateTo('user/profile');
                            }
                        }
                    });
                }
                if (user.attributes.lastPasswordChange) {
                    var policyChange = new Date('2023-10-26T01:12:06.510Z')
                    console.log(user.attributes.lastPasswordChange);
                    var changeDate = new Date(user.attributes.lastPasswordChange)
                    if ((changeDate < policyChange)) {
                       openPopup();
                    }
                } else {
                    openPopup();
                }
            }
        })
    })
})