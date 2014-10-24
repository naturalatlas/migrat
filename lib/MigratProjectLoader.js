var path = require('path');
var MigratProject = require('./MigratProject.js');

module.exports = function(file, callback) {
	var config, file = file || (process.cwd() + '/migrat.config.js');
	try {
		config = require(file);
	} catch (e) {
		return callback(new Error('Unable to load config file: ' + file + ' (message: "' + e.message + '")'));
	}

	// resolve paths relative to config file
	if (config.localState) {
		config.localState = path.resolve(path.dirname(file), config.localState);
	}
	if (config.migrationsDir) {
		config.migrationsDir = path.resolve(path.dirname(file), config.migrationsDir);
	}

	callback(null, new MigratProject(config));
};