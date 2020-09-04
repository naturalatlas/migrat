var once = require('lodash/once');
var chalk = require('chalk');
var async = require('async');
var Time = require('../Time.js');
var Log = require('../Log.js');
var figures = require('figures');
var humanizeDuration = require('humanize-duration');
var MigratPlanner = require('../MigratPlanner.js');
var MigratExecutor = require('../MigratExecutor.js');
var MigratStateStore = require('../MigratStateStore.js');
var MigratProjectLoader = require('../MigratProjectLoader.js');
var MigratProjectBridge = require('../MigratProjectBridge.js');
var MigratRunListPrinter = require('../MigratRunListPrinter.js');

function lockCallback(label, timeout, callback) {
	if (!timeout || timeout <= 0) return callback;
	callback = once(callback);

	var _timeout = setTimeout(function() {
		callback(new Error(label + ' timeout limit reached (' + timeout + 'ms)'));
	}, timeout);
	return callback;
};

module.exports = function(action, options, callback) {
	Log.options = options;

	// initialize the project
	var lockAcquired = false;
	var migrationStarted = false;
	var plan, project, plugins, locker, bridge;
	var store_local;
	var store_global;
	var state_local;
	var state_global;
	var time_start;
	var time_start = new Date();

	async.series([
		function loadConfig(callback) {
			MigratProjectLoader(options.config, function(err, _project, _plugins) {
				bridge = new MigratProjectBridge(_project, _plugins);
				project = _project;
				plugins = _plugins;
				callback(err);
			});
		},
		function synchronizeTime(callback) {
			Time.synchronize(callback);
		},
		function invokeInitialize(callback) {
			bridge.executeHook('initialize', [callback]);
		},
		function acquireLock(callback) {
			locker = bridge.getLockMethods();
			if (options.dryRun || !locker.lock) {
				return callback();
			} else if (!locker.unlock) {
				return callback(new Error('Project missing "unlock" function'));
			}
			Log.write('Acquiring lock... ');
			locker.lock(lockCallback('Lock', project.lockTimeout, function(err) {
				if (err) Log.writeln(chalk.red(figures.cross));
				else Log.writeln(chalk.gray(figures.tick));
				lockAcquired = !err;
				callback(err);
			}));
		},
		function loadState(callback) {
			Log.write('Loading current state... ');
			store_local = bridge.getLocalStateStore();
			store_global = bridge.getGlobalStateStore();
			async.auto({
				local: function(callback) { store_local.get(callback) },
				global: function(callback) { store_global.get(callback) }
			}, function(err, states) {
				if (err) Log.writeln(chalk.red(figures.cross));
				else Log.writeln(chalk.gray(figures.tick));
				if (!err) {
					state_global = states.global;
					state_local = states.local;
				}
				callback(err);
			});
		},
		function ensureLocalStateWriteable(callback) {
			if (options.dryRun) return callback();
			Log.write('Ensuring local state writable... ');
			store_local.set(state_local, function(err) {
				if (err) Log.writeln(chalk.red(figures.cross));
				else Log.writeln(chalk.gray(figures.tick));
				callback(err);
			});
		},
		function ensureGlobalStateWriteable(callback) {
			if (options.dryRun) return callback();
			Log.write('Ensuring global state writable... ');
			store_global.set(state_global, function(err) {
				if (err) Log.writeln(chalk.red(figures.cross));
				else Log.writeln(chalk.gray(figures.tick));
				callback(err);
			});
		},
		function createMigrationPlan(callback) {
			var planner = MigratPlanner[action];
			planner(project, plugins, state_global, state_local, options, function(err, _runlist) {
				runlist = _runlist;
				callback(err);
			});
		},
		function executePlan(callback) {
			Log.writeln(chalk.bold('[begin migration]'));
			migrationStarted = true;
			if (options.dryRun) {
				MigratRunListPrinter(project, runlist, options, callback);
			} else {
				function writer(item, callback) {
					if (item.method === 'skip') return callback();

					var state, store;
					if (item.migration.type === 'all') {
						state = state_local;
						store = store_local;
					} else {
						state = state_global;
						store = store_global;
					}

					if (item.method === 'up') {
						state.add(item.migration);
					} else if (item.method === 'down') {
						state.remove(item.migration);
					}
					store.set(state, callback);
				}
				MigratExecutor(project, plugins, runlist, options, writer, callback);
			}
		}
	], function(err) {
		if (migrationStarted) Log.write(chalk.bold('[end migration]') + '\n');
		async.series([
			function releaseLock(callback) {
				if (!lockAcquired) return callback();
				Log.write('Releasing lock... ');
				locker.unlock(lockCallback('Unlock', project.lockTimeout, function(err) {
					if (err) Log.writeln(chalk.red(figures.cross));
					else Log.writeln(chalk.gray(figures.tick));
					callback(err);
				}));
			}
		], function(_err) {
			async.series([
				function invokeTerminate(callback) {
					bridge.executeHook('terminate', [callback]);
				}
			], function(__err) {
				var duration = humanizeDuration((new Date()).getTime() - time_start);

				err = err || _err || __err || null;
				if (err) {
					Log.writeln('');
					Log.error.writeln(err.message || err);
					if (!options.dryRun) {
						Log.writeln(chalk.red('Migration job failed after ' + duration));
					}
					process.exit(1);
				} else {
					if (!options.dryRun) {
						Log.writeln('');
						Log.writeln(chalk.green('Migration job succeeded after ' + duration));
					}
					process.exit(0);
				}
			})
		});
	});
};
