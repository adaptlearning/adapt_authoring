define(function (require) {
    var Origin = require('core/origin');
    var UserInfoModel = require('./models/userInfoModel');

    Origin.once('origin:dataReady login:changed location:change', function () {
        var user = new UserInfoModel();
        user.fetch({
            success: function () {
                function openPopup(){
                    Origin.Notify.alert({
                        type: 'warning',
                        text: Origin.l10n.t('app.passwordchangemessage'),
                        showConfirmButton: true,
                        confirmButtonText: 'Go to Profile',
                        closeOnConfirm: true,
                        showCancelButton: false,
                        callback: function (isConfirm) {
                            if (isConfirm) {
                                Origin.router.navigateTo('user/profile');
                            }
                        }
                    });
                }
                if (user.attributes.lastPasswordChange) {
                    var policyChange = new Date('2023-06-26T01:12:06.510Z')
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