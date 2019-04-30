define([ 'core/origin', './models/schemasModel' ], function(Origin, SchemasModel) {
  var editorData;
  var configModel;

  var Schemas = function(schemaName) {
    editorData = Origin.editor.data;
    configModel = editorData.config;

    var schema = JSON.parse(JSON.stringify(Origin.schemas.get(schemaName)));

    if (!schema) {
      throw new Error('No schema found for "' + schemaName + '"');
    }
    if (!configModel) { // new course, so remove plugins
      delete schema._extensions;
      delete schema.menuSettings;
      delete schema.themeSettings;
      delete schema.themeVariables;
      return schema;
    }
    trimPlugins(schema);
    if (schemaName === 'course') trimGlobals(schema);
    trimEmptyProperties(schema);

    return schema;
  };

  function trimPlugins(schema) {
    trimDisabledPlugins(schema._extensions, _.values(configModel.get('_enabledExtensions')), 'targetAttribute');
    // trim unnecessary data for menus and themes
    ['menu','theme'].forEach(function(type) {
      var current = editorData[type + 'types'].findWhere({ name: configModel.get('_' + type) });
      if(current) trimDisabledPlugins(schema[type + 'Settings'], [current.toJSON()]);
    });
  }

  // remove unrequired globals from the course
  function trimGlobals(schema) {
    var globals = schema._globals.properties;
    trimDisabledPlugins(globals._extensions, _.values(configModel.get('_enabledExtensions')));
    trimDisabledPlugins(globals._components, configModel.get('_enabledComponents'), '_component');
    trimDisabledPlugins(globals._menu, editorData.menutypes.where({ name: configModel.get('_menu') }));
    trimDisabledPlugins(globals._theme, editorData.themetypes.where({ name: configModel.get('_theme') }));
    // trim off the empty globals objects
    trimEmptyProperties(globals);
  }

  function trimDisabledPlugins(schemaData, enabledPlugins, propertyToCheck) {
    if(!schemaData || !schemaData.properties) {
      return;
    }
    if(!propertyToCheck) {
      propertyToCheck = 'targetAttribute';
    }
    var enabledPluginNames = enabledPlugins.map(function(plugin) {
      return plugin[propertyToCheck] || plugin.get && plugin.get(propertyToCheck);
    });
    Object.keys(schemaData.properties).forEach(function(schemaKey) {
      if(enabledPluginNames.indexOf(schemaKey) === -1) delete schemaData.properties[schemaKey];
    });
  }

  function trimEmptyProperties(object) {
    for (var key in object) {
      if (!object.hasOwnProperty(key) || object[key].type !== 'object') continue;
      if (_.isEmpty(object[key].properties)) delete object[key];
    }
  }

  return Schemas;
});
