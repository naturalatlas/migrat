var _ = require('lodash');
var chalk = require('chalk');
var async = require('async');
var Time = require('../Time.js');
var MigratPlanner = require('../MigratPlanner.js');
var MigratExecutor = require('../MigratExecutor.js');
var MigratStateStore = require('../MigratStateStore.js');
var MigratProjectLoader = require('../MigratProjectLoader.js');
var MigratRunListPrinter = require('../MigratRunListPrinter.js');
var DefaultLocalStore = require('../DefaultStateStores/LocalStateStore.js');
var DefaultGlobalStore = require('../DefaultStateStores/GlobalStateStore.js');

function lockCallback(label, timeout, callback) {
	if (timeout <= 0) return callback;
	callback = _.once(callback);

	var _timeout = setTimeout(function() {
		callback(new Error(label + ' timeout limit reached (' + timeout + 'ms)'));
	}, timeout);
	return callback;
};

module.exports = function(action, options, callback) {
	// initialize the project
	var lockAcquired = false;
	var loggingEnabled = !options.silent && !options.json;
	var plan, project, plugins, locker;
	var store_local;
	var store_global;
	var state_local;
	var state_global;

	async.series([
		function loadConfig(callback) {
			MigratProjectLoader(options.config, function(err, _project, _plugins) {
				project = _project;
				plugins = _plugins;
				callback(err);
			});
		},
		function synchronizeTime(callback) {
			Time.synchronize(callback);
		},
		function invokeInitialize(callback) {
			if (!project.initialize) return callback();
			project.initialize(callback);
		},
		function invokePluginInitialize(callback) {
			plugins.executeHook('initialize', [callback]);
		},
		function acquireLock(callback) {
			locker = plugins.getLockMethods() || {lock: project.lock, unlock: project.unlock};

			if (options.dryRun || !locker.lock) {
				return callback();
			} else if (!locker.unlock) {
				return callback(new Error('Project missing "unlock" function'));
			}
			if (loggingEnabled) process.stdout.write('Acquiring lock... ');
			locker.lock(lockCallback('Lock', project.lockTimeout, function(err) {
				if (loggingEnabled) {
					if (err) process.stdout.write(chalk.red('(failed)') + '\n');
					else process.stdout.write('(done)\n');
				}
				lockAcquired = !err;
				callback(err);
			}));
		},
		function loadState(callback) {
			if (loggingEnabled) process.stdout.write('Loading current state... ');
			store_local = plugins.getLocalStateStore() || DefaultLocalStore(project);
			store_global = plugins.getGlobalStateStore() || DefaultGlobalStore(project);
			async.auto({
				local: function(callback) { store_local.get(callback) },
				global: function(callback) { store_global.get(callback) }
			}, function(err, states) {
				if (loggingEnabled)  {
					if (err) process.stdout.write(chalk.red('(failed)') + '\n');
					else process.stdout.write('(done)\n');
				}
				if (!err) {
					state_global = states.global;
					state_local = states.local;
				}
				callback(err);
			});
		},
		function ensureLocalStateWriteable(callback) {
			if (options.dryRun) return callback();
			if (loggingEnabled) process.stdout.write('Ensuring local state writable... ');
			store_local.set(state_local, function(err) {
				if (loggingEnabled)  {
					if (err) process.stdout.write(chalk.red('(failed)') + '\n');
					else process.stdout.write('(pass)\n');
				}
				callback(err);
			});
		},
		function ensureGlobalStateWriteable(callback) {
			if (options.dryRun) return callback();
			if (loggingEnabled) process.stdout.write('Ensuring global state writable... ');
			store_global.set(state_global, function(err) {
				if (loggingEnabled)  {
					if (err) process.stdout.write(chalk.red('(failed)') + '\n');
					else process.stdout.write('(pass)\n');
				}
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
		async.series([
			function releaseLock(callback) {
				if (!lockAcquired) return callback();
				if (loggingEnabled) process.stdout.write('Releasing lock... ');
				locker.unlock(lockCallback('Unlock', project.lockTimeout, function(err) {
					if (loggingEnabled) {
						if (err) process.stdout.write(chalk.red('(failed)') + '\n');
						else process.stdout.write('(done)\n');
					}
					callback(err);
				}));
			}
		], function(_err) {
			async.series([
				function invokeTerminate(callback) {
					if (!project.terminate) return callback();
					project.terminate(callback);
				},
				function invokePluginTerminate(callback) {
					plugins.executeHook('terminate', [callback]);
				}
			], function(__err) {
				err = err || _err || __err || null;
				if (err) {
					console.error(err.message || err);
					process.exit(1);
				} else {
					process.exit(0);
				}
			})
		});
	});
};