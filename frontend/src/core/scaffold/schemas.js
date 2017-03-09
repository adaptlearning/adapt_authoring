// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Origin = require('coreJS/app/origin');
    var SchemasModel = require('coreJS/scaffold/models/schemasModel');

    var Schemas = function(schemaName) {
        var configModel = Origin.editor.data.config;

        if (configModel) {
            // Remove any extensions and components that are not enabled on this course
            var enabledExtensions = configModel.get('_enabledExtensions');
            var enabledExtensionsKeys = [];

            // Grab the targetAttribute
            _.each(enabledExtensions, function(value, key) {
                enabledExtensionsKeys.push(value.targetAttribute);
            });



            // Get the schema
            var schema = JSON.parse(JSON.stringify(Origin.schemas.get(schemaName)));
            // Compare the enabledExtensions against the current schemas
            if (schema._extensions) {
                _.each(schema._extensions.properties, function(value, key) {
                    if (!_.contains(enabledExtensionsKeys, key)) {
                        delete schema._extensions.properties[key];
                    }
                });
                if(_.isEmpty(schema._extensions.properties)) {
                    delete schema._extensions;
                }
            }

            if (schema.menuSettings) {
                // only include settings for used menus
                var appliedMenus = [ configModel.get('_menu') ]; // TODO we only support one menu right now...
                _.each(schema.menuSettings.properties, function(value, key) {
                    if (!_.contains(appliedMenus, value.name)) {
                        delete schema.menuSettings.properties[key];
                    }
                });
                if(_.isEmpty(schema.menuSettings.properties)) {
                    delete schema.menuSettings;
                }
            }

            if (schema.themeSettings) {
                // only include settings for used themes
                var appliedThemes = [ configModel.get('_theme') ]; // TODO we only support one theme right now...
                _.each(schema.themeSettings.properties, function(value, key) {
                    if (!_.contains(appliedThemes, value.name)) {
                        delete schema.themeSettings.properties[key];
                    }
                });
                if(_.isEmpty(schema.themeSettings.properties)) {
                    delete schema.themeSettings;
                }
            }

            if (schemaName == 'course') {
                // Remove unrequired globals from the course
                if (schema._globals && schema._globals.properties._extensions) {
                    _.each(schema._globals.properties._extensions.properties, function(value, key) {
                        if (!_.contains(enabledExtensionsKeys, key)) {
                            delete schema._globals.properties._extensions.properties[key];
                        }
                    });
                }

                // Go through each _enabledComponents and find it in the schemas
                if (schema._globals && schema._globals.properties._components) {

                    var enabledComponents = configModel.get('_enabledComponents');

                    var enabledComponentsKeys = _.pluck(enabledComponents, '_component');
                    _.each(schema._globals.properties._components.properties, function(value, key) {
                        if (!_.contains(enabledComponentsKeys, key)) {
                            delete schema._globals.properties._components.properties[key];
                        }
                    });

                }

                // trim off the empty globals objects
                _.each(schema._globals.properties, function(value, key) {
                    if(_.isEmpty(value.properties)) {
                    delete schema._globals.properties[key];
                    }
                });

            }

            // trim off any empty fieldsets
            _.each(schema, function(value, key) {
                if(value.hasOwnProperty('properties') && _.isEmpty(value.properties)) {
                delete schema[key];
                }
            });

            // Return the modified schema
            return schema;
        } else {
            var schema = JSON.parse(JSON.stringify(Origin.schemas.get(schemaName)));
            delete schema._extensions;
            // Remove globals as these are appended to the course model
            delete schema.globals;

            if(!schema.themeSettings.properties) delete schema.themeSettings;
            if(!schema.menuSettings.properties) delete schema.menuSettings;
            
            return schema;
        }
    };

  return Schemas;
});
