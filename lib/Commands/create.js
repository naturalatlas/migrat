var fs = require('fs');
var async = require('async');
var chalk = require('chalk');
var path = require('path');
var Log = require('../Log.js');
var Time = require('../Time.js');
var MigratProjectLoader = require('../MigratProjectLoader.js');

module.exports = function(options, callback) {
	var project, name;
	Log.options = options;
	options.name = options._[3];
	if (!options.name) {
		return callback(new Error('No migration name provided'));
	} else if (!/^[a-z0-9\-\_]+$/i.test(options.name)) {
		return callback(new Error('Migration name can only contain letters, numbers, dashes, and underscores.'));
	}

	function done(err, callback) {
		if (err) Log.write(chalk.red('(failed)') + '\n');
		else Log.write(chalk.green('(done)') + '\n');
		callback(err);
	}

	function defaultTemplate(details, callback) {
		fs.readFile(path.resolve(__dirname, '../Templates/migration.js'), 'utf8', function(err, content) {
			if (err) return done(err, callback);
			callback(null, content
				.replace('{{attribution}}', details.user ? ' by ' + details.user : '')
				.replace('{{date}}', (new Date(details.timestamp)).toString()));
		});
	}

	async.series([
		function loadConfig(callback) {
			MigratProjectLoader(options.config, function(err, _project) {
				project = _project;
				callback(err);
			});
		},
		function synchronizeTime(callback) {
			Time.synchronize(callback);
		},
		function createMigration(callback) {
			var suffix = '';
			if (options.allNodes) suffix = '.all';
			var stamp = Time.stamp();
			var filename = stamp + '-' + options.name + suffix + '.js';
			var file = project.migrationsDir + '/' + filename;
			var templateFetcher = project.migrationTemplate || defaultTemplate;

			Log.write('Creating migration: ' + filename + ' ');
			templateFetcher({
				user: process.env.USER,
				timestamp: stamp,
				filename: filename
			}, function(err, content) {
				if (err) return done(err, callback);
				fs.writeFile(file, content, 'utf8', function(err) {
					done(err, callback);
				});
			});
		}
	], callback);
};