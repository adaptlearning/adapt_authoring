define(function (require) {
    var Origin = require('core/origin');
    var Backbone = require('backbone');
    var Helpers = require('core/helpers');
    var currentLocation = '';
    var previousLocation = '';

    Origin.on('location:change', function(){
        previousLocation = '';
        currentLocation = '';
    })

    var fetch = Backbone.Collection.prototype.fetch;
    Backbone.Collection.prototype.fetch = function () {
        return fetch.apply(this, arguments).success(function () {
            previousLocation = currentLocation;
            currentLocation = window.location.hash;
            if (currentLocation !== previousLocation) {
                var build = Helpers.getCookie('buildNumber');
                if (!window.buildNumber) {
                    window.buildNumber = build;
                }
                if (window.buildNumber !== build) {
                    Origin.Notify.auto({
                        type: 'info',
                        text: Origin.l10n.t('app.updateavailable'),
                        showConfirmButton: true,
                        confirmButtonText: Origin.l10n.t('app.refresh'),
                        closeOnConfirm: false,
                        autoConfirm: true,
                        autoTimer: 20000,
                        showCancelButton: true,
                        cancelButtonText: Origin.l10n.t('app.cancel'),
                        closeOnCancel: true,
                        callback: function (isConfirm) {
                            if (isConfirm) {
                                window.location.reload();
                            }
                        }
                    });
                }
            }
        })
    };
});