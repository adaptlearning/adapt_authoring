var express = require('express');
var logger = require('../../lib/logger');
var server = module.exports = express();
var usermanager = require('../../lib/usermanager');

server.get('/download/:tenant/:course/download.zip', function (req, res, next) {
  var course = req.params.course,
      tenant = req.params.tenant,
      currentUser = usermanager.getCurrentUser();

  if (currentUser && (currentUser.tenant._id == tenant)) {
    var outputplugin = app.outputmanager.getOutputPlugin('adapt', function (error, plugin){
      if (error) {
        logger.log('error', error);
        res.json({ success: false, message: error.message });
        return res.end();
      } else {
        plugin.publish(course, false, req, res, function (error, result) {
          if (error) {
            logger.log('error', 'Unable to publish');
            return res.json({ success: false, message: error.message });
          }

          res.statusCode = 200;
          return res.json({success: true});
        });
      }
    });
  } else {
    // User doesn't have access to this course
    res.statusCode = 401;
    return res.json({success: false});
  }  
});
