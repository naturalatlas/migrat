var _ = require('lodash');
var assert = require('chai').assert;
var MigratProject = require('../lib/MigratProject.js');
var MigratExecutor = require('../lib/MigratExecutor.js');
var MigratRunList = require('../lib/MigratRunList.js');
var MigratMigration = require('../lib/MigratMigration.js');
var MockMigration = require('./mocks/MockMigration.js');

describe('MigratExecutor', function() {
	it('should not error if any of the hooks are not defined', function(done) {
		var executedHook = false;
		var project = new MigratProject({});
		var runlist = new MigratRunList();
		var migration = MockMigration('/1414050095205-mockfile.js');
		runlist.push('up', migration);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.isUndefined(err);
			done();
		});
	});
	it('should not execute any migrations marked as "skip"', function(done) {
		var executedHook = false;
		var project = new MigratProject({});
		var runlist = new MigratRunList();
		var migration = MockMigration('/1414050095205-mockfile.js');
		migration.methods.up = function(context, callback) { throw new Error('Migration "up" executed'); };
		migration.methods.down = function(context, callback) { throw new Error('Migration "down" executed'); };
		migration.methods.check = function(context, callback) { throw new Error('Migration "check" executed'); };
		runlist.push('skip', migration);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.isUndefined(err);
			done();
		});
	});
	it('should execute any migrations marked as "up"', function(done) {
		var executedUp = false;
		var executedCheck = false;
		var project = new MigratProject({});
		var runlist = new MigratRunList();
		var migration = MockMigration('/1414050095205-mockfile.js');
		migration.methods.up = function(context, callback) { executedUp = true; callback(); };
		migration.methods.down = function(context, callback) { throw new Error('Migration "down" executed'); };
		migration.methods.check = function(context, callback) { executedCheck = true; callback(); };
		runlist.push('up', migration);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.isUndefined(err);
			assert.isTrue(executedUp, 'Executed "up"');
			assert.isTrue(executedCheck, 'Executed "check"');
			done();
		});
	});
	it('should execute any migrations marked as "down"', function(done) {
		var executedDown = false;
		var executedCheck = false;
		var project = new MigratProject({});
		var runlist = new MigratRunList();
		var migration = MockMigration('/1414050095205-mockfile.js');
		migration.methods.down = function(context, callback) { executedDown = true; callback(); };
		migration.methods.up = function(context, callback) { throw new Error('Migration "up" executed'); };
		runlist.push('down', migration);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.isUndefined(err);
			assert.isTrue(executedDown, 'Executed "up"');
			done();
		});
	});
	it('should abort further migrations if a migration returns an error', function(done) {
		var project = new MigratProject({});
		var runlist = new MigratRunList();
		var migration1 = MockMigration('/1414050095205-mockfile.js');
		migration1.methods.up = function(context, callback) { callback(new Error('Migration1 up failed')); };
		migration1.methods.down = function(context, callback) { throw new Error('Migration1 "down" executed'); };
		var migration2 = MockMigration('/1414050095206-mockfile.js');
		migration2.methods.up = function(context, callback) { throw new Error('Migration2 "up" executed'); };
		migration2.methods.down = function(context, callback) { throw new Error('Migration2 "down" executed'); };
		migration2.methods.check = function(context, callback) { throw new Error('Migration2 "check" executed'); };
		runlist.push('up', migration1);
		runlist.push('up', migration2);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.instanceOf(err, Error);
			assert.equal(err.message, 'Migration1 up failed');
			done();
		});
	});
	it('should abort further migrations if any checks return an error', function(done) {
		var project = new MigratProject({});
		var runlist = new MigratRunList();
		var migration1 = MockMigration('/1414050095205-mockfile.js');
		migration1.methods.up = function(context, callback) { callback(); };
		migration1.methods.down = function(context, callback) { throw new Error('Migration1 "down" executed'); };
		migration1.methods.check = function(context, callback) { callback(new Error("Migration1 check failed")); };
		var migration2 = MockMigration('/1414050095206-mockfile.js');
		migration2.methods.up = function(context, callback) { throw new Error('Migration2 "up" executed'); };
		migration2.methods.down = function(context, callback) { throw new Error('Migration2 "down" executed'); };
		migration2.methods.check = function(context, callback) { throw new Error('Migration2 "check" executed'); };
		runlist.push('up', migration1);
		runlist.push('up', migration2);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.instanceOf(err, Error);
			assert.equal(err.message, 'Migration1 check failed');
			done();
		});
	});
	it('should provide "context" to migration methods', function(done) {
		var executedUp = false;
		var executedCheck = false;
		var contextExecutions = 0;
		var project = new MigratProject({
			context: function(callback) {
				contextExecutions++;
				callback({message: 'hello'});
			}
		});

		var runlist = new MigratRunList();

		var checkContext = function(context, callback) {
			assert.equal(context.message, 'hello');
			callback();
		};

		var migration = MockMigration('/1414050095205-mockfile.js');
		migration.methods.up = checkContext;
		migration.methods.check = checkContext;
		var migration2 = MockMigration('/1414050095208-mockfile.js');
		migration2.methods.up = checkContext;
		migration2.methods.check = checkContext;

		runlist.push('up', migration);
		runlist.push('up', migration2);

		var options = {};
		MigratExecutor(project, runlist, options, function(err) {
			assert.equal(contextExecutions, 1);
			done();
		});
	});
	it('should call "beforeRun" hook', function(done) {
		var executedUp = false;
		var executedHook = false;
		var project = new MigratProject({
			beforeRun: function(_runlist, callback) {
				executedHook = true;
				assert.equal(_runlist, runlist);
				callback();
			}
		});
		var runlist = new MigratRunList();
		var migration = MockMigration('/1414050095205-mockfile.js');
		migration.methods.up = function(context, callback) {
			assert.isTrue(executedHook);
			executedUp = true;
			callback();
		};
		runlist.push('up', migration);

		var options = {};
		MigratExecutor(project, runlist, options, function(err) {
			assert.isTrue(executedUp);
			assert.isUndefined(err);
			done();
		});
	});
	it('should call "beforeEach" hook', function(done) {
		var executedUp = false;
		var executedHook = false;

		var project = new MigratProject({
			beforeEach: function(item, callback) {
				assert.equal(item.method, 'up');
				assert.equal(item.migration, migration);
				executedHook = true;
				callback();
			}
		});
		var runlist = new MigratRunList();
		var migration = MockMigration('/1414050095205-mockfile.js');
		migration.methods.up = function(context, callback) {
			assert.isTrue(executedHook);
			executedUp = true;
			callback();
		};
		runlist.push('up', migration);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.isUndefined(err);
			assert.isTrue(executedUp);
			done();
		});
	});
	it('should call "afterEach" hook', function(done) {
		var executedUp = false;
		var executedHook = false;

		var project = new MigratProject({
			afterEach: function(err, item, callback) {
				assert.isNull(err);
				assert.equal(item.method, 'up');
				assert.equal(item.migration, migration);
				assert.isTrue(executedUp);
				executedHook = true;
				callback();
			}
		});
		var runlist = new MigratRunList();
		var migration = MockMigration('/1414050095205-mockfile.js');
		migration.methods.up = function(context, callback) {
			assert.isFalse(executedHook);
			executedUp = true;
			callback();
		};
		runlist.push('up', migration);
		var options = {};

		MigratExecutor(project, runlist, options, function(err) {
			assert.isUndefined(err);
			assert.isTrue(executedHook);
			done();
		});
	});
	it('should call "afterRun" hook', function(done) {
		var executedHook = false;
		var project = new MigratProject({
			afterRun: function(err, _runlist, callback) {
				assert.isNull(err);
				executedHook = true;
				assert.equal(_runlist, runlist);
				callback();
			}
		});
		var runlist = new MigratRunList();
		var options = {};
		MigratExecutor(project, runlist, options, function(err) {
			assert.isTrue(executedHook);
			assert.isUndefined(err);
			done();
		});
	});
});