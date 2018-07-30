define([ 'core/origin', './models/schemasModel' ], function(Origin, SchemasModel) {
  var Schemas = function(schemaName) {
    var schema = JSON.parse(JSON.stringify(Origin.schemas.get(schemaName)));

    if (!schema) {
      throw new Error('No schema found for "' + schemaName + '"');
    }
    if (!Origin.editor.data.config) { // new course, so remove plugins
      delete schema._extensions;
      delete schema.menuSettings;
      delete schema.themeSettings;
      return schema;
    }
    trimPlugins(schema);
    if (schemaName === 'course') trimGlobals(schema);
    trimEmptyProperties(schema);

    return schema;
  };

  function trimPlugins(schema) {
    trimDisabledPlugins(schema._extensions, Object.values(Origin.editor.data.config.get('_enabledExtensions')), 'targetAttribute');
    // trim unnecessary data for menus and themes
    ['menu','theme'].forEach(function(type) {
      var current = Origin.editor.data[type + 'types'].findWhere({
        name: Origin.editor.data.config.get('_' + type)
      });
      if(current) trimDisabledPlugins(schema[type + 'Settings'], [current.toJSON()], type);
    });
  }

  // remove unrequired globals from the course
  function trimGlobals(schema) {
    var editorData = Origin.editor.data;
    var config = editorData.config;
    var globals = schema._globals.properties;
    trimDisabledPlugins(globals._extensions, Object.values(config.get('_enabledExtensions')), 'targetAttribute');
    trimDisabledPlugins(globals._components, config.get('_enabledComponents'), '_component');
    trimDisabledPlugins(globals._menu, editorData.menutypes.where({ name: config.get('_menu') }), 'menu');
    trimDisabledPlugins(globals._theme, editorData.themetypes.where({ name: config.get('_theme') }), 'theme');
    // trim off the empty globals objects
    trimEmptyProperties(globals);
  }

  function trimDisabledPlugins(schemaData, enabledPlugins, propertyToCheck) {
    if(!schemaData || !schemaData.properties) {
      return;
    }
    var enabledPluginNames = enabledPlugins.map(function(plugin) {
      var value = plugin[propertyToCheck] || plugin.get && plugin.get(propertyToCheck);
      // FIXME #2023: all plugin type data should be consistent
      var shouldPrefixUnderscore = propertyToCheck === 'menu' || propertyToCheck === 'theme';
      return shouldPrefixUnderscore ? '_' + value : value;
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
