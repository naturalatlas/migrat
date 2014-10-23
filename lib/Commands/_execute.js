var _ = require('lodash');
var chalk = require('chalk');
var async = require('async');
var Time = require('../Time.js');
var MigratProject = require('../MigratProject.js');
var MigratPlanner = require('../MigratPlanner.js');
var MigratExecutor = require('../MigratExecutor.js');
var MigratStateStore = require('../MigratStateStore.js');
var MigratRunListPrinter = require('../MigratRunListPrinter.js');

function lockCallback(timeout, callback) {
	if (timeout <= 0) return callback;
	callback = _.once(callback);

	var _timeout = setTimeout(function() {
		callback(new Error('Timeout limit reached (' + timeout + 's)'));
	}, timeout * 1000);
	return callback;
};

module.exports = function(action, config, options, callback) {
	// initialize the project
	var project = new MigratProject(config);
	var store = new MigratStateStore(project);
	var lockAcquired = false;
	var states, plan;
	var loggingEnabled = !options.silent && !options.json;

	async.series([
		function synchronizeTime(callback) {
			Time.synchronize(callback);
		},
		function acquireLock(callback) {
			if (options.dryRun || !project.lock) {
				return callback();
			}
			if (loggingEnabled) process.stdout.write('Acquiring lock... ');
			project.lock(lockCallback(project.lockTimeout, function(err) {
				if (loggingEnabled && err) process.stdout.write(chalk.red('(failed)') + '\n');
				lockAcquired = !err;
				callback(err);
			}));
		},
		function loadState(callback) {
			if (loggingEnabled) process.stdout.write('Loading current state... ');
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
				MigratExecutor(project, runlist, options, callback);
			}
		}
	], function(err) {
		async.series([
			function releaseLock(callback) {
				if (!lockAcquired) return callback();
				project.releaseLock(lockCallback(project.lockTimeout, callback));
			}
		], function() {
			if (err) {
				console.error(err.message || err);
				process.exit(1);
			} else {
				process.exit(0);
			}
		});
	});
};