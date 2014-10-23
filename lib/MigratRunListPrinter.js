var chalk = require('chalk');
var Log = require('./Log.js');

module.exports = function(project, runlist, options, callback) {
	Log.options = options;
	if (options.json) {
		console.log(JSON.stringify(runlist.items.map(function(item) {
			return [item.method, item.migration.filename];
		})));
	} else {
		runlist.items.forEach(function(item) {
			Log.write(module.exports.getString(item) + '\n');
		});
	}
	callback();
};

module.exports.getString = function(item) {
	var result = '';

	// method
	if (item.method === 'up') {
		result += chalk.bold('up');
	} else if (item.method === 'down') {
		result += chalk.yellow('down');
	} else {
		result += chalk.gray(item.method);
	}

	// filename
	result += chalk.gray(':') + ' ';
	if (item.method !== 'skip') {
		result += item.migration.filename;
	} else {
		result += chalk.gray(item.migration.filename);
	}

	return result;
};