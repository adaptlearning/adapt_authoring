define('partials',['require','handlebars'], function(require, Handlebars) { this.Handlebars = Handlebars; this["Handlebars"] = this["Handlebars"] || {};
this["Handlebars"]["partial"] = this["Handlebars"]["partial"] || {};
this["Handlebars"]["partial"]["part_editorItemSidebar"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"editor-item-settings handle\">\n    <div class=\"editor-item-settings-inner\">\n        <a href=\"#\" class=\"open-context-icon open-context-"
    + escapeExpression(((helper = (helper = helpers._type || (depth0 != null ? depth0._type : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_type","hash":{},"data":data}) : helper)))
    + "\" title=\""
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.clicktoedit", {"name":"t","hash":{},"data":data})))
    + "\">\n            <i class=\"fa fa-cog fa-fw\"></i>\n        </a>\n        <a href=\"#\" class=\""
    + escapeExpression(((helper = (helper = helpers._type || (depth0 != null ? depth0._type : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_type","hash":{},"data":data}) : helper)))
    + "-delete editor-delete-page-element\" title=\""
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.clicktodelete", {"name":"t","hash":{},"data":data})))
    + "\">\n            <i class=\"fa fa-trash-o\"></i>\n        </a>\n    </div>\n</div>";
},"useData":true});
this["Handlebars"]["partial"]["part_editorMenu"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div class=\"editor-menu-options\">\n  <a class=\"page-add-link\" href=\"#\">Add new page</a>\n</div>\n<div class=\"editor-page-list\"></div>\n";
  },"useData":true});
this["Handlebars"]["partial"]["part_editorCommon"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<div class=\"sidebar-item-inner\">\n    <div class=\"sidebar-row sidebar-item-title\">\n        <h2 class=\"sidebar-item-title-inner\">\n            Global Settings\n        </h2>\n    </div>\n    <div class=\"sidebar-row\">\n        <button class=\"editor-common-sidebar-project\">\n            <span class=\"editor-common-sidebar-project-inner\">\n                <i class=\"fa fa-cog\"></i>"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.projectsettings", {"name":"t","hash":{},"data":data})))
    + "\n            </span>\n        </button>\n    </div>\n    <div class=\"sidebar-row\">\n        <button class=\"editor-common-sidebar-config\">\n            <span class=\"editor-common-sidebar-config-inner\">\n                <i class=\"fa fa-cogs\"></i>"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.configurationsettings", {"name":"t","hash":{},"data":data})))
    + "\n            </span>\n        </button>\n    </div>\n    <div class=\"sidebar-row\">\n        <button class=\"editor-common-sidebar-select-theme\">\n            <span class=\"editor-common-sidebar-select-theme-inner\">\n                <i class=\"fa fa-image\"></i>"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.themepicker", {"name":"t","hash":{},"data":data})))
    + "\n            </span>\n        </button>\n    </div>\n    <div class=\"sidebar-row\">\n        <button class=\"editor-common-sidebar-menusettings\">\n            <span class=\"editor-common-sidebar-menusettings-inner\">\n                <i class=\"fa fa-sitemap\"></i>"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.menupicker", {"name":"t","hash":{},"data":data})))
    + "\n            </span>\n        </button>\n    </div>\n    <div class=\"sidebar-row\">\n        <button class=\"editor-common-sidebar-extensions\">\n            <span class=\"editor-common-sidebar-extensions-inner\">\n                <i class=\"fa fa-plug\"></i>"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.manageextensions", {"name":"t","hash":{},"data":data})))
    + "\n            </span>\n        </button>\n    </div>\n    <div class=\"sidebar-row\">\n        <button class=\"editor-common-sidebar-preview\">\n            <span class=\"editor-common-sidebar-preview-inner\">\n                <i class=\"fa fa-desktop\"></i>"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.preview", {"name":"t","hash":{},"data":data})))
    + "\n            </span>\n        </button>\n    </div>\n    <div class=\"sidebar-row\">\n       <button class=\"editor-common-sidebar-publish\">\n            <span class=\"editor-common-sidebar-publish-inner\">\n                <i class=\"fa fa-download\"></i>"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.publish", {"name":"t","hash":{},"data":data})))
    + "\n            </span>\n        </button>\n    </div>\n    <div class=\"sidebar-row\">\n        <button class=\"editor-common-sidebar-close\">\n            <span class=\"editor-common-sidebar-close-inner\">\n                <i class=\"fa fa-close\"></i>Close\n            </span>\n        </button>\n    </div>\n    <form id=\"downloadForm\" method=\"get\" action=\"\">\n    </form>\n</div>";
},"useData":true});
this["Handlebars"]["partial"]["part_settingsGeneral"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function";
  return "<!-- Begin General settings -->\n<div class=\"editing-overlay-panel-content\">\n  <div class=\"editing-overlay-panel-content-inner\">\n    <form role=\"form\">\n      <div class=\"form-group\">\n        <label for=\"setting-title\">"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.title", {"name":"t","hash":{},"data":data})))
    + "</label>\n        <input type=\"text\" class=\"form-control setting-title\" placeholder=\""
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.title", {"name":"t","hash":{},"data":data})))
    + "\" value=\""
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "\">\n      </div>\n      <div class=\"form-group\">\n        <label for=\"setting-displaytitle\">"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.displaytitle", {"name":"t","hash":{},"data":data})))
    + "</label>\n        <input type=\"text\" class=\"form-control setting-displaytitle\" placeholder=\""
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.displaytitle", {"name":"t","hash":{},"data":data})))
    + "\" value=\""
    + escapeExpression(((helper = (helper = helpers.displayTitle || (depth0 != null ? depth0.displayTitle : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"displayTitle","hash":{},"data":data}) : helper)))
    + "\">\n      </div>\n      <div class=\"form-group\">\n        <label for=\"setting-class\">"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.class", {"name":"t","hash":{},"data":data})))
    + "</label>\n        <input type=\"text\" class=\"form-control setting-class\" placeholder=\""
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.class", {"name":"t","hash":{},"data":data})))
    + "\" value=\""
    + escapeExpression(((helper = (helper = helpers._classes || (depth0 != null ? depth0._classes : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"_classes","hash":{},"data":data}) : helper)))
    + "\">\n      </div>\n      <div class=\"form-group\">\n        <label for=\"setting-body\">"
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.bodytext", {"name":"t","hash":{},"data":data})))
    + "</label>\n        <textarea class=\"text-editor form-control setting-body\" id=\"setting-body\" placeholder=\""
    + escapeExpression(((helpers.t || (depth0 && depth0.t) || helperMissing).call(depth0, "app.bodytext", {"name":"t","hash":{},"data":data})))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.body || (depth0 != null ? depth0.body : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"body","hash":{},"data":data}) : helper)))
    + "</textarea>\n      </div>\n    </form> \n  </div>\n</div>\n<!-- end General settings -->     ";
},"useData":true}); for(var key in Handlebars.partial) { Handlebars.registerPartial(key,Handlebars.partial[key]); } })