// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Product management module
 */

var util = require('util'),
    async = require('async'),
    database = require('./database'),
    logger = require('./logger'),
    configuration = require('./configuration');

// Constants
var MODNAME = 'productmanager';
var WAITFOR = 'database';
var ZERO_DATE = new Date(0).getTime(); // used in timeEnd to indicate a subscription is not time dependent

// custom errors
function ProductCreateError (message) {
  this.name = 'ProductCreateError';
  this.message = message || 'Product create error';
}

util.inherits(ProductCreateError, Error);

function DuplicateProductError (message) {
  this.name = 'DuplicateProductError';
  this.message = message || 'Product already exists';
}

util.inherits(DuplicateProductError, Error);

function SubscriptionCreateError (message) {
  this.name = 'SubscriptionCreateError';
  this.message = message || 'Subcription create error';
}

util.inherits(SubscriptionCreateError, Error);

exports = module.exports = {

  // expose errors
  errors: {
    'ProductCreateError': ProductCreateError,
    'DuplicateProductError': DuplicateProductError
  },

  // some public constants
  ZERO_DATE: ZERO_DATE,

  /**
   * preload function sets up event listener for startup events
   *
   * @param {object} app - the AdaptBuilder instance
   * @return {object} preloader - an AdaptBuilder ModulePreloader
   */

  preload : function (app) {
    var preloader = new app.ModulePreloader(app, MODNAME, { events:this.preloadHandle(app,this) });
    return preloader;
  },

  /**
   * Event handler for preload events
   *
   * @param {object} app - Server instance
   * @param {object} instance - Instance of this module
   * @return {object} hash map of events and handlers
   */

  preloadHandle : function (app, instance) {
    return {

      preload : function () {
        var preloader = this;
        preloader.emit('preloadChange', MODNAME, app.preloadConstants.WAITING);
      },

      moduleLoaded : function (modloaded) {
        var preloader = this;

        // is the module that loaded this modules requirement
        if (modloaded === WAITFOR) {
          preloader.emit('preloadChange', MODNAME, app.preloadConstants.LOADING);

          app.productmanager = instance;
          // set up routes
          var rest = require('./rest');
          var self = instance;

          /**
           * Products
           */

          // create product
          rest.post('/product', function (req, res, next) {
            var productData = req.body;

            self.createProduct(productData, function (err, result) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(result);
            });
          });

          // add course to product
          rest.post('/product/:productid/course/:courseid', function (req, res, next) {
            var productId = req.params.productid;
            var courseId = req.params.courseid;

            self.retrieveProduct({ _id: productId }, function (err, productRec) {
              if (err) {
                return next(err);
              }

              // verify course exists (must be on master)
              database.getDatabase(function (err, db) {
                if (err) {
                  return next(err);
                }

                db.retrieve('course', { _id: courseId }, function (err, results) {
                  if (!results || 1 !== results.length) {
                    return next(new Error('Course not found: ' + courseId));
                  }

                  // check course is not already a member of the product set
                  async.detect(
                    productRec.courses,
                    function (productCourseId, cb) {
                      return cb(productCourseId == courseId);
                    },
                    function (found) {
                      if (found) {
                        // course is already a member
                        return next(new Error('Course is already a member of this product!'));
                      }

                      var courses = productRec.courses;
                      courses.push(courseId);

                      // ok to update product
                      db.update('product', { _id: productId }, { courses: courses }, function (err, result) {
                        if (err) {
                          return next(err);
                        }

                        res.statusCode = 200;
                        return res.json(result);
                      });
                    }
                  );
                });
              }, configuration.getConfig('dbName'));
            });
          });

          // remove course from product
          rest.delete('/product/:productid/course/:courseid', function (req, res, next) {
            var productId = req.params.productid;
            var courseId = req.params.courseid;

            self.retrieveProduct({ _id: productId }, function (err, productRec) {
              if (err) {
                return next(err);
              }

              // remove course from productRec.courses if it exists
              async.reject(
                productRec.courses,
                function (productCourseId, cb) {
                  return cb(productCourseId == courseId);
                },
                function (filteredCourses) {
                  self.updateProduct({ _id: productId }, { courses: filteredCourses }, function (err) {
                    if (err) {
                      return next(err);
                    }

                    // if the course was never part of the product course set, this is
                    // still considered a success.
                    res.statusCode = 200;
                    return res.json({ success: true });
                  });
                }
              );
            });
          });

          // enumerate products
          rest.get('/product', function (req, res, next) {
            var search = req.query;
            var options = req.query.operators || {};

            self.retrieveProducts(search, options, function (err, results) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(results);
            });
          });

          // single product
          rest.get('/product/:id', function (req, res, next) {
            var id = req.params.id;
            var options = req.query.operators || {};

            if (!id || 'string' !== typeof id) {
              res.statusCode = 400;
              return res.json({ success: false, message: 'id param must be an objectid' });
            }

            self.retrieveProduct({ _id: id }, options, function (err, productRec) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(productRec);
            });
          });

          // update a single product
          rest.put('/product/:id', function (req, res, next) {
            var id = req.params.id;
            var delta = req.body;

            self.updateProduct({ _id: id }, delta, function (err, result) {
              if (err) {
                return next(err);
              }

              // update was successful
              res.statusCode = 200;
              return res.json(result);
            });
          });

          // delete (softly) a product
          rest.delete('/product/:id', function (req, res, next) {
            var id = req.params.id;

            self.destroyProduct(id, function (err) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json({ success: true, message: 'successfully deleted product!' });
            });
          });

          /**
           * Subscriptions
           */

          // create subscription
          rest.post('/subscription', function (req, res, next) {
            var subscriptionData = req.body;

            self.createSubscription(subscriptionData, function (err, result) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(result);
            });
          });

          // enumerate subscriptions
          rest.get('/subscription', function (req, res, next) {
            var search = req.query;
            var options = req.query.operators || {};

            self.retrieveSubscriptions(search, options, function (err, results) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(results);
            });
          });

          // single subscription
          rest.get('/subscription/:id', function (req, res, next) {
            var id = req.params.id;
            var options = req.query.operators || {};

            if (!id || 'string' !== typeof id) {
              res.statusCode = 400;
              return res.json({ success: false, message: 'id param must be an objectid' });
            }

            self.retrieveSubscription({ _id: id }, options, function (err, subscriptionRec) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json(subscriptionRec);
            });
          });

          // update a single subscription
          rest.put('/subscription/:id', function (req, res, next) {
            var id = req.params.id;
            var delta = req.body;

            self.updateSubscription({ _id: id }, delta, function (err, result) {
              if (err) {
                return next(err);
              }

              // update was successful
              res.statusCode = 200;
              return res.json(result);
            });
          });

          // delete a subscription
          rest.delete('/subscription/:id', function (req, res, next) {
            var id = req.params.id;

            self.deleteSubscription({ _id: id }, function (err) {
              if (err) {
                return next(err);
              }

              res.statusCode = 200;
              return res.json({ success: true, message: 'successfully deleted subscription!' });
            });
          });

          // add course deletion hook
          app.contentmanager.addContentHook('destroy', 'course', {when:'pre'}, function (data, next) {
            var courseId = data[0]._id;
            var currentUser = app.usermanager.getCurrentUser();
            // only care about this on the master tenant
            database.getDatabase(function (err, db) {
              db.retrieve('course', { _id: courseId }, function (err, results) {
                if (err) {
                  // log, don't die
                  logger.log('error', 'error locating course', err)
                  return next(null, data);
                }

                // if the course exists on the master tenant, and the tenantId is the same as the
                // current user's tenant, we have a master course
                if (results && results.length) {
                  if (results[0]._tenantId == currentUser.tenant._id) {
                    // remove course from any products
                    return self.retrieveProducts(null, function (err, products) {
                      if (err) {
                        // log, don't die
                        logger.log('error', 'error locating course', err)
                        return next(null, data);
                      }

                      // iterate products and remove course from courseset if necessary
                      async.eachSeries(
                        products,
                        function (product, cb) {
                          var courseIndex = product.courses.indexOf(courseId);
                          if (courseIndex > -1) {
                            product.courses.splice(courseIndex, 1);
                            return app.productmanager.updateProduct({ _id: product._id }, { courses: product.courses }, cb);
                          }

                          // nothing to do
                          return cb();
                        },
                        function (stuff) {
                          // carry on
                          return next(null, data);
                        }
                      );
                    });
                  }
                }

                return next(null, data);
              });
            }, configuration.getConfig('dbName'));
          });

          preloader.emit('preloadChange', MODNAME, app.preloadConstants.COMPLETE);
        }
      }
    };
  },

  /**
   * creates a product
   *
   * @param {object} product - a fully defined product object
   * @param {function} callback - function of the form function (error, product)
   */
  createProduct: function (product, callback) {
    var self = this;

    database.getDatabase(function(err, db){

      // name is our primary unique identifier
      if (!product.name || 'string' !== typeof product.name) {
        return callback(new ProductCreateError('product name is required!'));
      }

      // verify the product name is unique
      db.retrieve('product', { name: product.name }, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length) {
          // product exists
          return callback(new DuplicateProductError());
        }

        db.create('product', product, function (error, result) {
          // wrap the callback since we might want to alter the result
          if (error) {
            logger.log('error', 'Failed to create product: ', product);
            return callback(error);
          }

          return callback(null, result);
        });
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves products matching the search
   *
   * @param {object} search - fields of product that should be matched
   * @param {object} options - operators, populators etc
   * @param {function} callback - function of the form function (error, products)
   */

  retrieveProducts: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    if (!options.populate) {
      options.populate = { 'courses': '_id title' };
    }

    database.getDatabase(function(err, db){
      // delegate to db retrieve method
      db.retrieve('product', search, options, callback);
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves a single product
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} options - query, operators etc
   * @param {function} callback - function of the form function (error, product)
   */

  retrieveProduct: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    if (!options.populate) {
      options.populate = { 'courses': '_id title' };
    }

    database.getDatabase(function(err, db) {
      db.retrieve('product', search, options, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length === 1) {
            // we only want to retrieve a single product, so we send an error if we get multiples
            return callback(null, results[0]);
        }

        return callback(null, false);
      });
     }, configuration.getConfig('dbName'));
  },

  /**
   * updates a single product
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} update - fields to change and their values
   * @param {function} callback - function of the form function (error, product)
   */

  updateProduct: function (search, update, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // only execute if we have a single matching record
      self.retrieveProduct(search, function (error, result) {
        if (error) {
          return callback(error);
        }

        if (result) {
          db.update('product', search, update, function(error) {
            if (error) {
              return callback(error);
            }

            // Re-fetch the product
            self.retrieveProduct(search, function(error, result) {
              if (error) {
                return callback(error);
              }

              return callback(null, result);
            });

          });
        } else {
          return callback(new Error('No matching product record found'));
        }

      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * delete a product (soft delete, just updates the deleted flag)
   *
   * @param {string} productId - must match a product in db
   * @param {function} callback - function of the form function (error)
   */

  destroyProduct: function (productId, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // confirm the product exists and is there is only one of them
      self.retrieveProduct({ _id: productId }, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length === 1) {
          return self.updateProduct({ '_id': results[0]._id }, { _isDeleted: true }, callback);
        }

        return callback(new Error('No matching product record found'));
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * deletes a single product - usually we don't want to delete a product, only
   * set it to inactive
   *
   * @param {object} product - must match the product in db
   * @param {function} callback - function of the form function (error)
   */

  deleteProduct: function (product, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // confirm the product exists and is there is only one of them
      self.retrieveProduct(product, function (error, result) {
        if (error) {
          return callback(error);
        }

        if (result) {
          return db.destroy('product', product, callback);
        }

        return callback(new Error('No matching product record found'));
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * creates a subscription
   *
   * @param {object} subscription - a fully defined subscription object
   * @param {function} callback - function of the form function (error, subscription)
   */
  createSubscription: function (subscription, callback) {
    var self = this;

    database.getDatabase(function(err, db) {
      // verify the product exists and is live
      db.retrieve('product', { _id: subscription.product, _isDeleted: false }, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (!results || 1 !== results.length) {
          return callback(new SubscriptionCreateError('product is unknown: ' + subscription.product));
        }

        db.create('subscription', subscription, function (error, result) {
          // wrap the callback since we might want to alter the result
          if (error) {
            logger.log('error', 'Failed to create subscription: ', subscription);
            return callback(error);
          }

          return callback(null, result);
        });
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves subscriptions matching the search
   *
   * @param {object} search - fields of subscription that should be matched
   * @param {object} options - operators, populators etc
   * @param {function} callback - function of the form function (error, subscriptions)
   */

  retrieveSubscriptions: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    // ensure we populate product by default
    if (!options.populate) {
      options.populate = ['product'];
    }

    database.getDatabase(function(err, db){
      // delegate to db retrieve method
      db.retrieve('subscription', search, options, callback);
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves a single subscription
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} options - query, operators etc
   * @param {function} callback - function of the form function (error, subscription)
   */

  retrieveSubscription: function (search, options, callback) {
    // shuffle params
    if ('function' === typeof options) {
      callback = options;
      options = {};
    }

    // ensure we populate product by default
    if (!options.populate) {
      options.populate = ['product'];
    }

    database.getDatabase(function(err, db) {
      db.retrieve('subscription', search, options, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length === 1) {
            // we only want to retrieve a single subscription, so we send an error if we get multiples
            return callback(null, results[0]);
        }

        return callback(null, false);
      });
     }, configuration.getConfig('dbName'));
  },

  /**
   * updates a single subscription
   *
   * @param {object} search - fields to match: should use 'name' or '_id' which are unique
   * @param {object} update - fields to change and their values
   * @param {function} callback - function of the form function (error, subscription)
   */

  updateSubscription: function (search, update, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // only execute if we have a single matching record
      self.retrieveSubscription(search, function (error, result) {
        if (error) {
          return callback(error);
        }

        if (result) {
          db.update('subscription', search, update, function(error) {
            if (error) {
              return callback(error);
            }

            // Re-fetch the subscription
            self.retrieveSubscription(search, function(error, result) {
              if (error) {
                return callback(error);
              }

              return callback(null, result);
            });

          });
        } else {
          return callback(new Error('No matching subscription record found'));
        }

      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * delete a subscription (soft delete, just updates the deleted flag)
   *
   * @param {string} subscriptionId - must match a subscription in db
   * @param {function} callback - function of the form function (error)
   */

  destroySubscription: function (subscriptionId, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // confirm the subscription exists and is there is only one of them
      self.retrieveSubscription({ _id: subscriptionId }, function (error, results) {
        if (error) {
          return callback(error);
        }

        if (results && results.length === 1) {
          return self.updateSubscription({ '_id': results[0]._id }, { _isDeleted: true }, callback);
        }

        return callback(new Error('No matching subscription record found'));
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * deletes a single subscription
   *
   * @param {object} subscription - must match the subscription in db
   * @param {function} callback - function of the form function (error)
   */

  deleteSubscription: function (subscription, callback) {
    var self = this;
    database.getDatabase(function(err, db){
      // confirm the subscription exists and is there is only one of them
      self.retrieveSubscription(subscription, function (error, result) {
        if (error) {
          return callback(error);
        }

        if (result) {
          return db.destroy('subscription', subscription, callback);
        }

        return callback(new Error('No matching subscription record found'));
      });
    }, configuration.getConfig('dbName'));
  }
};
