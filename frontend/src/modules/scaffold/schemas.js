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
    // trim off any empty fieldsets
    trimEmptyProperties(schema);

    return schema;
  };

  function trimPlugins(schema) {
    trimDisabledPlugins(schema._extensions, Origin.editor.data.config.get('_enabledExtensions'));
    // trim unnecessary data for menus and themes
    ['menu','theme'].forEach(function(type) {
      var current = Origin.editor.data[type + 'types'].findWhere({
        name: Origin.editor.data.config.get('_' + type)
      });
      if(current) {
        var plugins = {}; // we only ever have one plugin of each, so mock the aggregated 'plugins' object
        plugins[current.get(type)] = current.toJSON();
        trimDisabledPlugins(schema[type + 'Settings'], plugins);
      }
    });
  }

  function trimGlobals(schema) {
    var globals = schema._globals.properties;
    var enabledComponents = _.pluck(Origin.editor.data.config.get('_enabledComponents'), '_component');
    // remove unrequired globals from the course
    trimDisabledPlugins(globals._extensions, Origin.editor.data.config.get('_enabledExtensions'));
    trimDisabledPlugins(globals._components, enabledComponents);
    trimDisabledPlugins(globals, enabledComponents);
    // trim off the empty globals objects
    trimEmptyProperties(globals);
  }

  function trimDisabledPlugins(schemaData, enabledPlugins) {
    var properties = schemaData && schemaData.properties;
    for (var key in properties) {
      if (!properties.hasOwnProperty(key)) {
        continue;
      }
      if(!_.contains(_.pluck(enabledPlugins, 'targetAttribute'), key)) {
        delete properties[key];
      }
    }
  }

  function trimEmptyProperties(object) {
    for (var key in object) {
      if (!object.hasOwnProperty(key) || object[key].type !== 'object') continue;
      if (_.isEmpty(object[key].properties)) delete object[key];
    }
  }

  return Schemas;
});
