const conf = require('./config.json');

module.exports = {
  mongodb: {
    url: conf.dbConnectionUri,
    options: { useNewUrlParser: true }
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false
};