var chalk = require('chalk');

module.exports = function(project, runlist, options, callback) {
	runlist.items.forEach(module.exports.getString);
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