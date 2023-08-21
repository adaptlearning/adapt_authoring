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
                    var message = document.createElement("p");
                    message.classList.add("password-force-message");
                    message.innerHTML = Origin.l10n.t('app.passwordForceMessage');
                    passwordFieldsView.el.prepend(message);
                    Origin.Notify.alert({
                        type: 'warning',
                        html: passwordFieldsView.el,
                        showConfirmButton: true,
                        allowOutsideClick: false,
                        confirmButtonText: Origin.l10n.t('app.save'),
                        showCancelButton: false,
                        preConfirm: function (e) {
                            var passwordVal = passwordFieldsView.$el.find(`#password${genericId}`)[0].value;
                            var confirmPasswordVal = passwordFieldsView.$el.find(`#confirmPassword${genericId}`)[0].value;

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

                            if (Object.keys(errorHash).length > 0) return false;

                            var toChange = {
                                _id: model.get('_id'),
                                _isNewPassword: true,
                                email_prev: model.get('email'),
                                password: passwordVal
                            };

                            shouldConfirm = $.ajax({
                                url: 'api/user/me',
                                method: 'PUT',
                                data: toChange,
                                async: false
                            });
                            if (shouldConfirm && ['500', 500].includes(shouldConfirm.status)) {
                                passwordFieldsView.$el.find('.server-errors-container').html(shouldConfirm.responseText);
                                return false;
                            }
                            else if (shouldConfirm && ['200', 200].includes(shouldConfirm.status)) {
                                passwordFieldsView.$el.find('.server-errors-container').html();
                                return true;
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