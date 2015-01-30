define(function(require) {

	var Origin = require('coreJS/app/origin');
	var SchemasModel = require('coreJS/scaffold/models/schemasModel');

	var Schemas = function(schemaName) {
		var configModel = Origin.editor.data.config;

		if (configModel) {
			// Remove any extensions that are not enabled on this course
			var enabledExtensions = configModel.get('_enabledExtensions');
			var enabledExtensionsKeys = [];
			// Grab the targetAttribute
			_.each(enabledExtensions, function(value, key) {
				enabledExtensionsKeys.push(value.targetAttribute);
			});

			// Get the schema
			var schema = _.clone(Origin.schemas.get(schemaName));
			// Compare the enabledExtensions against the current schemas
			if (schema._extensions) {
				_.each(schema._extensions.properties, function(value, key) {
					if (!_.contains(enabledExtensionsKeys, key)) {
						delete schema._extensions.properties[key];
					}
				});
			}

			// Maybe this is a little bit broken
			// But if something doesn't have properties object 
			// - remove it all together
			if (schema.properties && !schema.properties.properties) {
				delete schema.properties;
			}

			// Return the modified schema
			return schema;

		} else {
            var schema = _.clone(Origin.schemas.get(schemaName));
            delete schema._extensions;
            return schema;
        }
	};

	return Schemas;
})