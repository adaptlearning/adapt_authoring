define(function (require) {
    var Origin = require('core/origin');
    var UserInfoModel = require('./models/userInfoModel');
    var PasswordFieldsView = require('./views/passwordFieldsView');
    var PasswordHelpers = require('plugins/passwordChange/passwordHelpers');

    console.log(PasswordFieldsView);

    Origin.once('origin:dataReady login:changed location:change', function (e) {
        if (!e) return;
        var user = new UserInfoModel();
        user.fetch({
            success: function (model) {
                var genericId = 'ResetModal';
                var passwordToSave = '';
                var confirmPasswordToSave = '';
                model.set('fieldId', 'password')
                var passwordFieldsView = PasswordFieldsView({ model: model, genericId: genericId });
                function openPopup(){
                    Origin.Notify.alert({
                        type: 'warning',
                        html: passwordFieldsView.el,
                        showConfirmButton: true,
                        allowOutsideClick: false,
                        confirmButtonText: Origin.l10n.t('app.save'),
                        showCancelButton: true,
                        cancelButtonText: Origin.l10n.t('app.cancel'),
                        preConfirm: function (e) {
                            var passwordVal = $(this.html).find(`#password${genericId}`)[0].value;
                            var confirmPasswordVal = $(this.html).find(`#confirmPassword${genericId}`)[0].value;

                            var passwordErrors = PasswordHelpers.validatePassword(passwordVal);
                            var isConfirmPasswordValid = PasswordHelpers.validateConfirmationPassword(passwordVal, confirmPasswordVal);

                            passwordToSave = passwordVal;
                            confirmPasswordToSave = confirmPasswordVal;

                            var shouldConfirm = passwordErrors.length == 0 && isConfirmPasswordValid;

                            var errorHash = {};

                            if (passwordErrors.length > 0) {
                                errorHash['password'] = `${Origin.l10n.t('app.passwordindicatormedium')}`;
                            }

                            if (!isConfirmPasswordValid) {
                                errorHash['confirmPassword'] = `${Origin.l10n.t('app.confirmpasswordnotmatch')}`;
                            }
                            model.trigger('invalid', model, errorHash);

                            return shouldConfirm;
                        },
                        callback: function (isConfirm) {
                            console.log(passwordFieldsView.$el.find('#passwordResetModal')[0].value);
                            console.log(passwordFieldsView.$el.find('#confirmPasswordResetModal')[0].value);
                            console.log(isConfirm);
                            if (isConfirm) {
                                var postData = {
                                    "email": model.get('email'),
                                    "password": passwordToSave,
                                    "confirmPassword": confirmPasswordToSave
                                };
                                $.ajax('api/user/resetpassword', {
                                    data: postData,
                                    method: 'POST',
                                    error: function (data, status, error) {
                                        var message = error + ': ';
                                        if (data.responseText) message += data.responseText;
                                        Origin.Notify.alert({ type: 'error', text: message });
                                    },
                                    success: function () {
                                        Origin.Notify.alert({
                                            type: 'success',
                                            text: Origin.l10n.t('app.changepasswordtext', { email: model.get('email') })
                                        });
                                    }
                                });
                            }
                            else{
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