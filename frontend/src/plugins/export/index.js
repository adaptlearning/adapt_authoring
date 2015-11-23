// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');

  Origin.on('globalMenu:export', function() {
    var courseId = Origin.editor.data.course.get('_id');
    var tenantId = Origin.sessionModel.get('tenantId');

    $.get('/export/' + tenantId + '/' + courseId, function(data) {
      Origin.Notify.alert({
        type: (data.success) ? "success" : "error",
        title: "Exporting course",
        text: data.message
      });
    });

    // newWindow = window.open(uriContent, 'neuesDokument');
  });

  var globalMenuObject = {
    "location": "global",
    "text": "Export course",
    "icon": "fa-download",
    "callbackEvent": "export",
    "sortOrder": 4
  };

  Origin.on('app:dataReady login:changed', function() {
    Origin.globalMenu.addItem(globalMenuObject);
  });
});
