var async = require('async');
var chalk = require('chalk');
var figures = require('figures');
var Log = require('../Log.js');
var MigratProjectLoader = require('../MigratProjectLoader.js');
var MigratProjectBridge = require('../MigratProjectBridge.js');

module.exports = function(options, callback) {
	var project, plugins, bridge;
	Log.options = options;

	async.series([
		function loadConfig(callback) {
			MigratProjectLoader(options.config, function(err, _project, _plugins) {
				bridge = new MigratProjectBridge(_project, _plugins);
				project = _project;
				plugins = _plugins;
				callback(err);
			});
		},
		function executeInitializeHook(callback) {
			bridge.executeHook('initialize', [callback]);
		},
		function releaseLock(callback) {
			var locker = bridge.getLockMethods();
			if (!locker.unlock) {
				return callback(new Error('Project missing "unlock" function'));
			}

			Log.write('Releasing lock... ');
			locker.unlock(function(err) {
				if (err) Log.writeln(chalk.red(figures.cross));
				else Log.writeln(chalk.green(figures.tick));
				callback(err);
			});
		}
	], function(err) {
		bridge.executeHook('terminate', [function(_err) {
			callback(err || _err || null);
		}]);
	});
};