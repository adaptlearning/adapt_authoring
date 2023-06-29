define(function (require) {
    var Origin = require('core/origin');
    var Helpers = require('core/helpers');
    Origin.on('location:title:hide', function(event){
        if(Origin.location.route1 === 'login'){
            var pageTitle = Origin.l10n.t('app.login') + " - " + Origin.l10n.t('app.productname');
            $('head title')[0].innerText = pageTitle;
        }
    })
    Origin.on('location:title:update', function(event){
        var page = event.breadcrumbs ? event.breadcrumbs[event.breadcrumbs.length - 1].title || Helpers.capitalise(event.breadcrumbs[event.breadcrumbs.length - 1]) : '';
        var pageTitle = event.title;
        if(page) pageTitle +=  " - " + page;
        pageTitle += " - " + Origin.l10n.t('app.productname');
        $('head title')[0].innerText = pageTitle;
    })
});