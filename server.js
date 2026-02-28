const argv = require('optimist').argv;
const clientName = argv._[0];

if (!clientName) {
  console.log('Error: no client name supplied');
	return;
}

const app = require('./lib/application')(clientName);

app.run(argv);
