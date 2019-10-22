const app = require('./lib/application')();
const argv = require('optimist').argv;

app.run(argv);
