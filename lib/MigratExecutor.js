var async = require('async');
var chalk = require('chalk');
var Log = require('./Log.js');
var MigratRunListPrinter = require('./MigratRunListPrinter.js');

module.exports = function MigratExecutor(project, runlist, options, callback) {
	var context;
	Log.options = options;

	async.series([
		function createContext(callback) {
			if (!project.context) {
				return callback();
			}
			project.context(function(err, _context) {
				context = _context;
				callback(err);
			});
		},
		function executeBeforeRunHook(callback) {
			if (!project.beforeRun) return callback();
			project.beforeRun(runlist, callback);
		},
		function executeRunList(callback) {
			if (!runlist.items) {
				Log.write('No applicable migrations were found\n');
				return callback();
			}
			async.eachSeries(runlist.items, function(item, callback) {
				async.series([
					function executeBeforeEachHook(callback) {
						if (!project.beforeEach) return callback();
						project.beforeEach(item, callback);
					},
					function executeItem(callback) {
						Log.write(MigratRunListPrinter.getString(item));
						if (item.method !== 'skip') {
							item.migration.methods[item.method](context, function(err) {
								if (err) Log.write(' ' + chalk.red('(failed)'));
								else Log.write(' ' + chalk.green('(executed)'));
								callback(err);
							});
						} else {
							Log.write(' ' + chalk.gray('(skipped)'));
							callback();
						}
					},
					function verifyItem(callback) {
						var check = item.migration.methods['check'];
						if (!check || item.method === 'skip') {
							Log.write('\n');
							return callback();
						}
						check(context, function(err) {
							if (err) Log.write(' but ' + chalk.red('failed verification') + '\n');
							else Log.write(' and ' + chalk.green('passed verification') + '\n');
							callback(err);
						});
					}
				], function(err) {
					if (!project.afterEach) return callback(err);
					project.afterEach(err || null, item, function() {
						callback(err);
					});
				});

			}, callback);
		}
	], function(err) {
		async.series([
			function executeAfterRunHook(callback) {
				if (!project.afterRun) return callback();
				project.afterRun(err || null, runlist, function() {
					callback();
				});
			},
			function rollBack(callback) {
				callback();
				// TODO: implement
				// if (err && project.rollbackOnError) { ... }
			}
		], function() {
			callback(err);
		});
	});
};