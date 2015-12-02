// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');

  Origin.on('globalMenu:export', function() {
    var courseId = Origin.editor.data.course.get('_id');
    var tenantId = Origin.sessionModel.get('tenantId');

    Origin.Notify.alert({
      title: "Exporting course",
      text: "Please stand by...",
      imageUrl: "adaptbuilder/css/assets/export.GIF",
      showConfirmButton: false
    });

    $.get('/export/' + tenantId + '/' + courseId, function(data, textStatus, jqXHR) {
      var success = jqXHR.status === 200;
      Origin.Notify.alert({
        type: success ? "success" : "error",
        title: success ? window.polyglot.t('app.successdefaulttitle') : window.polyglot.t('app.errordefaulttitle'),
        text: data.message
      });

      var form = document.createElement("form");
      form.setAttribute('action', '/export/' + tenantId + '/' + courseId + '/' + data.zipName + '/download.zip');
      form.submit();
    });

  });

  Origin.on('app:dataReady login:changed', function() {
    Origin.globalMenu.addItem({
      "location": "editor",
      "text": "Export course",
      "icon": "fa-download",
      "callbackEvent": "export",
      "sortOrder": 4
    });
  });
});
