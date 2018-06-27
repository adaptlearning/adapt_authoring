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

    // remove any extensions and components that are not enabled on this course
    var enabledExtensions = _.pluck(config.get('_enabledExtensions'), 'targetAttribute');
    var schemaExtensions = schema._extensions;
    var schemaExtensionsProperties = schemaExtensions && schemaExtensions.properties;

    for (var key in schemaExtensionsProperties) {
      if (schemaExtensionsProperties.hasOwnProperty(key) &&
        !_.contains(enabledExtensions, key)) {
        delete schemaExtensionsProperties[key];
      }
    }

    if (schemaName === 'course') {
      // remove unrequired globals from the course
      var globals = schema._globals.properties;
      var extensionGlobals = globals._extensions.properties;
      var componentGlobals = globals._components.properties;
      var enabledComponents = _.pluck(config.get('_enabledComponents'), '_component');

      for (key in extensionGlobals) {
        if (extensionGlobals.hasOwnProperty(key) &&
          !_.contains(enabledExtensions, key)) {
          delete extensionGlobals[key];
        }
      }

      for (key in componentGlobals) {
        if (componentGlobals.hasOwnProperty(key) &&
          !_.contains(enabledComponents, key)) {
          delete componentGlobals[key];
        }
      }

      // trim off the empty globals objects
      for (key in globals) {
        if (globals.hasOwnProperty(key) && _.isEmpty(globals[key].properties)) {
          delete globals[key];
        }
      }
    }

    // trim off any empty fieldsets
    for (key in schema) {
      if (!schema.hasOwnProperty(key)) continue;

      var properties = schema[key].properties;

      if (properties && _.isEmpty(properties)) {
        delete schema[key];
      }
    }

    return schema;
  };

  return Schemas;

});
