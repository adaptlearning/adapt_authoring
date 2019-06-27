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
            },
            super: function(callback) {
                rolesCollection.findOne({name: 'Super Admin'}, (err, document) => {
                    if (err) throw err;
                    callback(null, document);
                });
            }
        }, function(err, results) {
            if (err) throw err;
            // If Product Manager and Course Creator roles exist convert
            // all Product Managers to Course Creators
            if (results.product && results.course) {
                try {
                    userCollection.updateMany(
                        {roles: {$in: [results.product._id]}},
                        {$set: {roles: [results.course._id]}}
                    );
                } catch (e) {
                    logger.log('error', e);
                    return;
                }
            }
            // If Tenant Admin and Super Admin roles exist convert
            // all Tenant Admins to Super Admins
            if (results.tenant && results.super) {
                try {
                    userCollection.updateMany(
                        {roles: {$in: [results.tenant._id]}},
                        {$set: {roles: [results.super._id]}}
                    );
                } catch (e) {
                    logger.log('error', e);
                    return;
                }
            }
            // Remove `Product Manager` and `Tenant Admin` roles
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
