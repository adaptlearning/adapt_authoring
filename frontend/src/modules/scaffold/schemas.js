define([ 'core/origin', './models/schemasModel' ], function(Origin, SchemasModel) {

  var Schemas = function(schemaName) {
    var schema = JSON.parse(JSON.stringify(Origin.schemas.get(schemaName)));

    if (!schema) {
      throw new Error('No schema found for "' + schemaName + '"');
    }

    var config = Origin.editor.data.config;

    if (!config) {
      delete schema._extensions;
      return schema;
    }
    var enabledExtensions = _.pluck(config.get('_enabledExtensions'), 'targetAttribute');

    trimDisabledPlugins(schema._extensions, enabledExtensions);
    trimDisabledPlugins(schema.menuSettings, [config.get('_menu')]);
    trimDisabledPlugins(schema.themeSettings, [config.get('_theme')]);

    if (schemaName === 'course') {
      var globals = schema._globals.properties;
      var enabledComponents = _.pluck(config.get('_enabledComponents'), '_component');
      // remove unrequired globals from the course
      trimDisabledPlugins(globals._extensions, enabledExtensions);
      trimDisabledPlugins(globals._components, enabledComponents);
      trimDisabledPlugins(globals, enabledComponents);
      // trim off the empty globals objects
      trimEmptyProperties(globals);
    }
    // trim off any empty fieldsets
    trimEmptyProperties(schema);

    return schema;
  };

  function trimDisabledPlugins(schemaData, enabledPlugins) {
    var properties = schemaData && schemaData.properties;
    for (var key in properties) {
      if (!properties.hasOwnProperty(key)) continue;
      if (!_.contains(enabledPlugins, key)) delete properties[key];
    }
  }

  function trimEmptyProperties(object) {
    for (key in object) {
      if (!object.hasOwnProperty(key) || object[key].type !== 'object') continue;
      if (_.isEmpty(object[key].properties)) delete object[key];
    }
  }

  return Schemas;
});
