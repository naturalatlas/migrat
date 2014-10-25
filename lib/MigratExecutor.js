var async = require('async');
var chalk = require('chalk');
var figures = require('figures');
var Log = require('./Log.js');
var MigratRunListPrinter = require('./MigratRunListPrinter.js');

module.exports = function MigratExecutor(project, plugins, runlist, options, writer, callback) {
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
		function executeProjectBeforeRunHook(callback) {
			if (!project.beforeRun) return callback();
			project.beforeRun(runlist, callback);
		},
		function executePluginBeforeRunHook(callback) {
			plugins.executeHook('beforeRun', [runlist, callback]);
		},
		function executeRunList(callback) {
			if (!runlist.items) {
				Log.write('No applicable migrations were found\n');
				return callback();
			}
			async.eachSeries(runlist.items, function(item, callback) {
				async.series([
					function executeProjectBeforeEachHook(callback) {
						if (!project.beforeEach) return callback();
						project.beforeEach(item, callback);
					},
					function executePluginBeforeEachHook(callback) {
						plugins.executeHook('beforeEach', [item, callback]);
					},
					function executeItem(callback) {
						Log.write(MigratRunListPrinter.getString(item));
						if (item.method !== 'skip') {
							item.migration.methods[item.method](context, function(err) {
								if (err) Log.write(' ' + chalk.red(figures.cross));
								else Log.write(' ' + chalk.green(figures.tick));
								callback(err);
							});
						} else {
							Log.write(' ' + chalk.gray('(skipped)'));
							callback();
						}
					},
					function verifyItem(callback) {
						var check = item.migration.methods['check'];
						if (!check || item.method !== 'up') {
							return callback();
						}
						check(context, function(err) {
							if (err) Log.write(' but ' + chalk.red('failed verification'));
							else Log.write(' and ' + chalk.green('passed verification'));
							callback(err);
						});
					},
					function persistItemStatus(callback) {
						writer(item, callback);
					}
				], function(err) {
					Log.write('\n');
					err = err || null;
					async.series([
						function executeProjectAfterEachHook(callback) {
							if (!project.afterEach) return callback();
							project.afterEach(err, item, callback);
						},
						function executePluginAfterEachHook(callback) {
							plugins.executeHook('afterEach', [err, item, callback]);
						}
					], function(_err) {
						callback(err || _err || null);
					});
				});

			}, callback);
		}
	], function(err) {
		err = err || null;
		async.series([
			function executeProjectAfterRunHook(callback) {
				if (!project.afterRun) return callback();
				project.afterRun(err, runlist, callback);
			},
			function executePluginAfterRunHook(callback) {
				plugins.executeHook('afterRun', [err, runlist, callback]);
			}
		], function(_err) {
			callback(err || _err || null);
		});
	});
};