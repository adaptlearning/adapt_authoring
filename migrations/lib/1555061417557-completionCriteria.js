const async = require('async');
const helpers = require('../helpers/helper');

exports.up = function copyCompletionCriteria(done) {
  helpers.start(({ db }) => {
    db.retrieve('config', {}, (error, configs) => {
      if (error) return done(error);

      async.each(configs, (config, callback) => {
        const extensions = config._extensions;
        const spoor = extensions && extensions._spoor;

        if (!spoor) return callback();

        const tracking = spoor._tracking;
        const spoorCompletion = tracking._requireCourseCompleted;

        if (spoorCompletion === undefined) return callback();

        db.update('config', { _id: config._id }, {
          _completionCriteria: {
            _requireContentCompleted: spoorCompletion,
            _requireAssessmentCompleted: tracking._requireAssessmentPassed
          }
        }, callback);
      }, done);
    });
  });
};
