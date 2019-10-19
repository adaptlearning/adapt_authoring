// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
const myArgs = process.argv.slice(2);
if (!myArgs.length) {
	console.log('Error: no client name supplied');
	return;
}
const app = require('./lib/application')(myArgs[0]);
app.run();
