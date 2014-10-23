var fs = require('fs');
var assert = require('chai').assert;
var MigratProject = require('../lib/MigratProject.js');
var MigratState = require('../lib/MigratState.js');
var MigratStateStore = require('../lib/MigratStateStore.js');
var MigratMigration = require('../lib/MigratMigration.js');

var randomTempStateFile = function(state) {
	var stateFile = __dirname + '/temp/.migratdb.' + String(Math.random()).substring(2);
	if (state) { fs.writeFileSync(stateFile, JSON.stringify(state), 'utf8'); }
	return stateFile;
};

describe('MigratStateStore', function() {
	describe('.local.get()', function() {
		it('should not error if state file doesn\'t exist yet', function(done) {
			var project = new MigratProject({localState: './does/not/exist.json'});
			var store = new MigratStateStore(project);
			store.local.get(function(err, state) {
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.equal(JSON.stringify(state.state), '{}');
				done();
			});
		});
		it('should return proper MigratState object', function(done) {
			var stateFile = randomTempStateFile({'1414046792583-test.all.js': 1414046792583});
			var project = new MigratProject({localState: stateFile});
			var store = new MigratStateStore(project);
			store.local.get(function(err, state) {
				var migration = new MigratMigration({filename: '1414046792583-test.all.js'});
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.isTrue(state.exists(migration));
				done();
			});
		});
		it('should return error if "localState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = new MigratStateStore(project);
			store.local.get(function(err, state) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /localState/);
				done();
			});
		});
	});
	describe('.local.set()', function() {
		it('should update state file', function(done) {
			var stateFile = randomTempStateFile();
			var project = new MigratProject({localState: stateFile});
			var store = new MigratStateStore(project);
			var state = new MigratState({'1414046792583-set.all.js': 1414046792583});
			store.local.set(state, function(err) {
				assert.isNull(err);
				var content = fs.readFileSync(stateFile, 'utf8');
				assert.equal(content, '{"1414046792583-set.all.js":1414046792583}');
				done();
			});
		});
		it('should return error if "localState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = new MigratStateStore(project);
			var state = new MigratState({'1414046792583-set.all.js': 1414046792583});
			store.local.set(state, function(err, state) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /localState/);
				done();
			});
		});
	});

	describe('.global.get()', function() {
		it('should return proper MigratState object via fetchState', function(done) {
			var project = new MigratProject({
				fetchState: function(callback) {
					return callback(null, '{"1414046792583-get.js":1414046792583}')
				}
			});
			var store = new MigratStateStore(project);
			store.global.get(function(err, state) {
				var migration = new MigratMigration({filename: '1414046792583-get.js'});
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.isTrue(state.exists(migration));
				done();
			});
		});
		it('should return error if "fetchState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = new MigratStateStore(project);
			store.global.get(function(err, state) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /fetchState/);
				done();
			});
		});
	});
	describe('.global.set()', function() {
		it('should invoke storeState', function(done) {
			var invokedStore = false;
			var project = new MigratProject({
				storeState: function(serializedState, callback) {
					invokedStore = true;
					assert.equal(serializedState, '{"1414046792583-set.js":1414046792583}');
					callback();
				}
			});
			var store = new MigratStateStore(project);
			var state = new MigratState({'1414046792583-set.js': 1414046792583});
			store.global.set(state, function(err) {
				assert.isUndefined(err);
				assert.isTrue(invokedStore);
				done();
			});
		});
		it('should return error if "storeState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = new MigratStateStore(project);
			var state = new MigratState({'1414046792583-set.js': 1414046792583});
			store.global.set(state, function(err) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /storeState/);
				done();
			});
		});
	});

	describe('.readState()', function() {
		it('should return an object containing pre-populated local & global state', function(done) {
			var stateFile = randomTempStateFile({
				'1414046792583-test.all.js': 1414046792583
			});
			var project = new MigratProject({
				localState: stateFile,
				fetchState: function(callback) {
					return callback(null, '{"1414046792583-anothertest.js":1414046792583}');
				}
			});

			var store = new MigratStateStore(project);
			store.readState(function(err, states) {
				var migration1 = new MigratMigration({filename: '1414046792583-test.all.js'});
				var migration2 = new MigratMigration({filename: '1414046792583-anothertest.js'});
				assert.isNull(err);
				assert.isObject(states);
				assert.instanceOf(states.local, MigratState);
				assert.instanceOf(states.global, MigratState);
				assert.isTrue(states.local.exists(migration1), 'local state');
				assert.isTrue(states.global.exists(migration2), 'global state');
				done();
			});
		});
		it('should fail if "fetchState" not set in config', function(done) {
			var stateFile = randomTempStateFile({
				'1414046792583-test.all.js': 1414046792583
			});
			var project = new MigratProject({
				localState: stateFile
			});

			var store = new MigratStateStore(project);
			store.readState(function(err, states) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /fetchState/);
				done();
			});
		});
		it('should fail if "localState" not set in config', function(done) {
			var project = new MigratProject({
				fetchState: function(callback) {
					return callback(null, '{"1414046792583-anothertest.js":1414046792583}');
				}
			});

			var store = new MigratStateStore(project);
			store.readState(function(err, states) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /localState/);
				done();
			});
		});
	});
});