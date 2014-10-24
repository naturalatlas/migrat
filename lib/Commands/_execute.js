var _ = require('lodash');
var chalk = require('chalk');
var async = require('async');
var Time = require('../Time.js');
var MigratPlanner = require('../MigratPlanner.js');
var MigratExecutor = require('../MigratExecutor.js');
var MigratStateStore = require('../MigratStateStore.js');
var MigratProjectLoader = require('../MigratProjectLoader.js');
var MigratRunListPrinter = require('../MigratRunListPrinter.js');

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
	var states, plan, project, store;
	var loggingEnabled = !options.silent && !options.json;

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
		function invokeInitialize(callback) {
			if (!project.initialize) return callback();
			project.initialize(callback);
		},
		function acquireLock(callback) {
			if (options.dryRun || !project.lock) {
				return callback();
			} else if (!project.unlock) {
				return callback(new Error('Project config missing "unlock" function'));
			}
			if (loggingEnabled) process.stdout.write('Acquiring lock... ');
			project.lock(lockCallback('Lock', project.lockTimeout, function(err) {
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
			store = new MigratStateStore(project);
			store.readState(function(err, _states) {
				if (loggingEnabled)  {
					if (err) process.stdout.write(chalk.red('(failed)') + '\n');
					else process.stdout.write('(done)\n');
				}
				states = _states;
				callback(err);
			});
		},
		function ensureLocalStateWriteable(callback) {
			if (options.dryRun) return callback();
			if (loggingEnabled) process.stdout.write('Ensuring local state writable... ');
			store.local.set(states.local, function(err) {
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
			store.global.set(states.global, function(err) {
				if (loggingEnabled)  {
					if (err) process.stdout.write(chalk.red('(failed)') + '\n');
					else process.stdout.write('(pass)\n');
				}
				callback(err);
			});
		},
		function createMigrationPlan(callback) {
			var planner = MigratPlanner[action];
			planner(project, states.global, states.local, options, function(err, _runlist) {
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
					var env = item.migration.type === 'all' ? 'local' : 'global';
					var state = states[env];
					if (item.method === 'up') {
						state.add(item.migration);
					} else if (item.method === 'down') {
						state.remove(item.migration);
					}
					store[env].set(state, callback);
				}
				MigratExecutor(project, runlist, options, writer, callback);
			}
		}
	], function(err) {
		async.series([
			function releaseLock(callback) {
				if (!lockAcquired) return callback();
				if (loggingEnabled) process.stdout.write('Releasing lock... ');
				project.unlock(lockCallback('Unlock', project.lockTimeout, function(err) {
					if (loggingEnabled) {
						if (err) process.stdout.write(chalk.red('(failed)') + '\n');
						else process.stdout.write('(done)\n');
					}
					callback(err);
				}));
			},
			function invokeTerminate(callback) {
				if (!project.terminate) return callback();
				project.terminate(callback);
			}
		], function(_err) {
			err = err || _err;
			if (err) {
				console.error(err.message || err);
				process.exit(1);
			} else {
				process.exit(0);
			}
		});
	});
};