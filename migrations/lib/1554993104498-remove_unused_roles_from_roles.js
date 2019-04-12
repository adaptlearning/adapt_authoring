'use strict';

var helpers = require('../helpers/helper');
var logger = require('../../lib/logger');
var async = require('async');

exports.up = function down(done) {
    helpers.start(function(app) {

        var rolesCollection = app.db.conn.collection('roles');
        var userCollection = app.db.conn.collection('users');

        async.parallel({
            tenant: function(callback) {
                rolesCollection.findOne({name: 'Tenant Admin'}, (err, document) => {
                    if (err) throw err;
                    callback(null, document);
                });
            },
            product: function(callback) {
                rolesCollection.findOne({name: 'Product Manager'}, (err, document) => {
                    if (err) throw err;
                    callback(null, document);
                });
            },
            course: function(callback) {
                rolesCollection.findOne({name: 'Course Creator'}, (err, document) => {
                    if (err) throw err;
                    callback(null, document);
                });
            }
        }, function(err, results) {
            if (err) throw err;
            var changingRoles = [];

            // Check if `Tenant Admin` role exists
            if (results.tenant) {
                changingRoles.push(results.tenant._id);
            }

            // Check if `Product Manager` role exists
            if (results.product) {
                changingRoles.push(results.product._id);
            }

            // If at least one of role exists and `Course Creator` exits
            // Change all given roles to `Course Creator`
            if (changingRoles.length !== 0 && results.course) {
                try {
                    userCollection.updateMany(
                        {roles: {$in: changingRoles}},
                        {$set: {roles: [results.course._id]}}
                    );
                } catch (e) {
                    logger.log('error', e);
                    return;
                }
            }

            // If roles changes was successfully remove `Product Manager` and `Tenant Admin` roles
            rolesCollection.deleteOne({name: 'Product Manager'});
            rolesCollection.deleteOne({name: 'Tenant Admin'});
        });

        done();
    });
};

exports.down = function down(done) {
    helpers.start(function(app) {
        /**
         * Do DOWN migration here
         * - reference master DB with app.db
         * - call done on finish
         */
        done();
    });
};
