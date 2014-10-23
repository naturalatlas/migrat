var fs = require('fs');
var async = require('async');
var chalk = require('chalk');
var path = require('path');
var Log = require('../Log.js');

module.exports = function(options, callback) {
	var configFile = process.cwd() + '/migrat.config.js';
	var migrationsDir = process.cwd() + '/migrations';
	Log.options = options;

	function done(err, callback) {
		if (err) Log.write(chalk.red('(failed)') + '\n');
		else Log.write(chalk.green('(done)') + '\n');
		callback(err);
	}

	async.series([
		function checkForExistence(callback) {
			fs.exists(configFile, function(exists) {
				if (exists) return callback(new Error('Migrat config already exists'));
				callback();
			});
		},
		function createConfig(callback) {
			Log.write('Writing configuration: migrat.config.js ');
			fs.readFile(path.resolve(__dirname, '../Templates/migrat.config.js'), 'utf8', function(err, content) {
				if (err) return done(err, callback);
				fs.writeFile(configFile, content, 'utf8', function(err) {
					done(err, callback);
				});
			});
		},
		function createMigrationsFolder(callback) {
			Log.write('Creating dir: migrations ');
			fs.mkdir(migrationsDir, 0777, function(err) {
				if (err && err.code === 'EEXIST') return done(null, callback);
				done(err, callback);
			});
		},
		function createGitKeep(callback) {
			Log.write('Creating file: migrations/.gitkeep ');
			fs.writeFile(migrationsDir + '/.gitkeep', '', 'utf8', function(err) {
				done(err, callback);
			});
		},
		function printInfo(callback) {
			Log.write(chalk.gray('Now create your first migration: migrat create <name>\n'));
			callback();
		}
	], callback);
};