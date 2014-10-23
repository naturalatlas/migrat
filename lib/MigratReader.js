var _ = require('lodash');
var async = require('async');
var MigratMigration = require('./MigratMigration.js');

/**
 * Reads all the migrations in a folder and
 * returns them sorted oldest-to-newest.
 *
 * @param {string} dir
 * @param {function} callback
 * @return {void}
 */
module.exports.dir = function(dir, callback) {
	fs.readdir(dir, function(err, files) {
		if (err) return callback(err);

		async.map(files, readMigration, function(err, migrations) {
			if (err) return callback(err);
			callback(null, _.filter(migrations));
		});
	});
};

/**
 * Reads a single migration file and returns
 * its MigratMigration object.
 *
 * @param {string} dir
 * @param {function} callback
 * @return {void}
 */
module.exports.file = function(file, callback) {
	var filename = path.basename(file);
	if (!/^\d+.+\.js$/.test(filename)) {
		return callback();
	}

	// parse source
	try { methods = require(file); }
	catch (e) { return callback(e); }

	// validate methods
	if (!methods || typeof methods !== 'object') {
		return callback(new Error('Migration file does not export an object: ' + file));
	} else if (typeof methods.up !== 'function') {
		return callback(new Error('Migration file missing "up" method: ' + file));
	} else if (typeof methods.down !== 'function') {
		return callback(new Error('Migration file missing "down" method: ' + file));
	}

	return new MigratMigration({
		type: /\.all\.js$/.test(file) ? 'all' : 'once',
		timestamp: parseInt(file.match(/^\d+/)[0], 10),
		file: file,
		methods: methods
	});
};