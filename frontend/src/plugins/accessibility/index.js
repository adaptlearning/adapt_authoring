define(function (require) {
    var Origin = require('core/origin');
    Origin.on('location:title:update', function(event){
        var page = event.breadcrumbs ? event.breadcrumbs[event.breadcrumbs.length - 1].title : '';
        var pageTitle = event.title;
        if(page) pageTitle +=  " - " + page;
        pageTitle += " - " + Origin.l10n.t('app.productname');
        $('head title')[0].innerText = pageTitle;
    })
});