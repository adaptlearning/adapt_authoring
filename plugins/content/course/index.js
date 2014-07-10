/**
 * Course Content plugin type
 */

var ContentPlugin = require('../../../lib/contentmanager').ContentPlugin,
    configuration = require('../../../lib/configuration'),
    util = require('util'),
    path = require('path'),
    async = require('async'),
    origin = require('../../../'),
    rest = require('../../../lib/rest'),
    database = require('../../../lib/database');

function CourseContent () {
}

util.inherits(CourseContent, ContentPlugin);

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  var self = this;
  var app = origin();
  app.once('serverStarted', function (server) {
    // add course duplicate route - @TODO - Restrict access to this!
    rest.get('/duplicatecourse/:id', function (req, res, next) {
      duplicate({_id: req.params.id}, function (error, newCourse) {
        if (error) {
          res.statusCode = 400;
          res.json({success: false, message: error.message});
          return res.end();
        }
        res.statusCode = 200;
        res.json({success: true, newCourseId: newCourse._id});
        return res.end();
      });
    });
  });
}

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
CourseContent.prototype.getModelName = function () {
  return 'course';
};

/**
 * implements ContentObject#getChildType
 *
 * @return {string}
 */
CourseContent.prototype.getChildType = function () {
  return ['contentobject', 'config'];
};

/**
 * Overrides base.destroy
 * @param {object} search
 * @param {callback} next
 */
CourseContent.prototype.destroy = function (search, next) {
  var self = this;

  // to cascade deletes, we need the _id, which may not be in the search param
  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    // courses use cascading delete
    if (docs && docs.length) {
      async.eachSeries(
        docs,
        function (doc, cb) {
          self.destroyChildren(doc._id, '_courseId', function (error) {
            if (error) {
              return cb(error);
            }
            ContentPlugin.prototype.destroy.call(self, {_id:doc._id}, cb);
          });
        },
        next);
    } else {
      next(null);
    }
  });
};

/**
 * Duplicate a course
 * @param {array} data
 * @param {callback} cb
 */
function duplicate (data, cb) {
  var self = this;

  if (!data) {
    return cb(null);
  }

  // Duplicate item
  CourseContent.prototype.retrieve({_id: data._id}, function (error, docs) {
    if (error) {
      return cb(error);
    }
    if (docs && docs.length) {
      var doc = docs[0].toObject();
      var oldCourseId = doc._id;

      delete doc._id;

      // New course name
      doc.title = 'Copy of ' + doc.title;

      CourseContent.prototype.create(doc, function (error, newCourse) {
        var newCourseId = newCourse._id;
        var parentIdMap = [];

        database.getDatabase(function (error, db) {
          async.eachSeries(['contentobject', 'article', 'block', 'component', 'config'],
          function (contenttype, nextContentType) {
            db.retrieve(contenttype, {_courseId: oldCourseId}, function (error, items) {
              if (error) {
                return nextContentType(error);
              }
              if (!parentIdMap.length) {
                parentIdMap[oldCourseId] = newCourseId;
              }

              if (contenttype == 'contentobject') {
                items = sortContentObjects(items);
              }

              async.eachSeries(items, function (item, next) {
                var contentData = item.toObject();
                var oldId = contentData._id;
                var oldParentId = contentData._parentId;

                delete contentData._id;
                contentData._courseId = newCourseId;
                contentData._parentId = parentIdMap[oldParentId];

                return db.create(contenttype, contentData, function (error, newContent) {
                  if (error) {
                    return next(error);
                  }
                  parentIdMap[oldId] = newContent._id;
                  next();
                });

              }, function (error) {
                if (error) {
                  return cb(error);
                }
                nextContentType(null);
              });
            });
          }, function (error) {
            cb(null, newCourse);
          });
        });
      });
    }
  });
};

/**
 * Sort contentObjects into correct creation order.
 * (Parent Menus must be created before child Menus/Pages)
 * @param {array} data
 * @param {callback} cb
 */
function sortContentObjects(data) {
  var flat = {},
      root = [],
      list = [],
      counter = 0;

  // Flatten the data
  for (var i = 0; i < data.length; i++) {
    var key = data[i].get('_id');

    flat[key] = {
      _id: data[i].get('_id'),
      _parentId: data[i].get('_parentId'),
      children: []
    };
  }

  // Populate any 'children' container arrays
  for (var i in flat) {
    var parentkey = flat[i]._parentId;

    if (flat[parentkey]) {
      flat[parentkey].children.push(flat[i]);
    }
  }

  // Find the root nodes (no parent found) and create the hierarchy tree from them
  for (var i in flat) {
    var parentkey = flat[i]._parentId;

    if (!flat[parentkey]) {
      root.push(flat[i]);
    }
  }

  for (var i in root) {
    appendToItems(list, root[i], counter);
  }

  for (var i = 0; i < data.length; i++) {
    data[i]._createOrder = list[data[i].get('_id')]._createOrder;
  }

  // Sort items according to creation order
  data.sort(function(a, b){
    return a._createOrder-b._createOrder;
  });

  return data;
};

/**
 * Recursive append item to list (and set creation order)
 * @param {array} list
 * @param {object} item
 * @param {int} counter
 */
function appendToItems (list, item, counter) {
  counter++;
  item._createOrder = counter;
  list[item._id] = item;

  if (item.children) {
    for (var i in item.children) {
      appendToItems(list, item.children[i], counter);
    }
  }
};

// setup course
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = CourseContent;
