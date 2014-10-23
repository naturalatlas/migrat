var _ = require('lodash');
var fs = require('fs');
var path = require('path');
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

		async.map(files, function(file, callback) {
			module.exports.file(dir + '/' + file, callback);
		}, function(err, migrations) {
			if (err) return callback(err);
			migrations = _.filter(migrations);

			// sanity check: make sure no migrations have the same timestamp
			var counts = {};
			var i, n, ts;
			for (i = 0, n = migrations.length; i < n; i++) {
				ts = migrations[i].timestamp;
				counts[ts] = (counts[ts] || 0) + 1;
				if (counts[ts] > 1) {
					callback(new Error('Two or more migrations find to have the same timestamp: ' + ts));
					return false;
				}
			}

			callback(null, migrations);
		});
	});
};

/**
 * Reads a single migration file and returns
 * its MigratMigration object.
 *
 * @param {string} file
 * @param {function} callback
 * @return {void}
 */
module.exports.file = function(file, callback) {
	var filename = path.basename(file);
	if (!/^\d+\-.+\.js$/.test(filename)) {
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

	// determine details from filename / path
	var details;
	try { details = module.exports.fileDetails(file); }
	catch (e) { return callback(e); }

	details.methods = methods;
	callback(null, new MigratMigration(details));
};

/**
 * Returns basic info about a file, given its path.
 * Does not attempt to open it to populate methods.
 *
 * @throws
 * @param {string} file
 * @return {object}
 */
module.exports.fileDetails = function(file, callback) {
	var filename = path.basename(file);
	if (!/^\d+\-.+\.js$/.test(filename)) {
		throw new Error('File not a valid migration file');
	}

	return {
		type: /\.all\.js$/.test(filename) ? 'all' : 'once',
		timestamp: parseInt(filename.match(/^\d+/)[0], 10),
		name: filename.match(/^\d+\-(.+?)(\.all)?\.js$/)[1],
		filename: filename,
		file: file
	};
};