var server = module.exports = require('express')();
var configuration = require('../../lib/configuration');
var logger = require('../../lib/logger');
var usermanager = require('../../lib/usermanager');

server.get('/export/:tenant/:course', function (req, res, next) {
  var course = req.params.course;
  var tenant = req.params.tenant;
  var currentUser = usermanager.getCurrentUser();

  if (currentUser && (currentUser.tenant._id == tenant)) {
    var outputplugin = app.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), function (error, plugin){
      if (error) {
        logger.log('error', error);
        res.json({
          success: false,
          message: error.message
        });
        return res.end();
      } else {
        plugin.export(course, req, res, function (error, result) {
          if (error) {
            logger.log('error', 'Unable to export');
            return res.json({
              success: false,
              message: error.message
            });
          }
          res.statusCode = 200;

          result.success = true;
          result.message = app.polyglot.t('app.exportcoursesuccess');
          return res.json(result);
        });
      }

    });
  } else {
    res.statusCode = 401;
    return res.json({
      success: false,
      message: "Sorry, the current user doesn't have access to this course"
    });
  }
});
