var fs = require('fs');
var assert = require('chai').assert;
var MigratProject = require('../lib/MigratProject.js');
var MigratState = require('../lib/MigratState.js');
var MigratStateStore = require('../lib/MigratStateStore.js');
var MigratMigration = require('../lib/MigratMigration.js');
var MockMigratMigration = require('./mocks/MockMigration.js');
var LocalStateStore = require('../lib/DefaultStateStores/LocalStateStore.js');

var randomTempStateFile = function(state) {
	var stateFile = __dirname + '/temp/.migratdb.' + String(Math.random()).substring(2);
	if (state) { fs.writeFileSync(stateFile, JSON.stringify(state), 'utf8'); }
	return stateFile;
};

describe('DefaultStateStores/LocalStateStore', function() {
	it('should return an instance of MigratStateStore', function() {
		var project = new MigratProject({});
		var store = LocalStateStore(project);
		assert.instanceOf(store, MigratStateStore);
	});
	describe('.get()', function() {
		it('should not error if state file doesn\'t exist yet', function(done) {
			var project = new MigratProject({localState: './does/not/exist.json'});
			var store = LocalStateStore(project);
			store.get(function(err, state) {
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.equal(JSON.stringify(state.state), '{}');
				done();
			});
		});
		it('should return proper MigratState object', function(done) {
			var stateFile = randomTempStateFile({'1414046792583-test.all.js': 1414046792583});
			var project = new MigratProject({localState: stateFile});
			var store = LocalStateStore(project);
			store.get(function(err, state) {
				var migration = new MigratMigration({filename: '1414046792583-test.all.js'});
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.isTrue(state.exists(migration));
				done();
			});
		});
		it('should return error if "localState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = LocalStateStore(project);
			store.get(function(err, state) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /localState/);
				done();
			});
		});
	});
	describe('.set()', function() {
		it('should update state file', function(done) {
			var stateFile = randomTempStateFile();
			var project = new MigratProject({localState: stateFile});
			var store = LocalStateStore(project);
			var state = new MigratState({'1414046792583-set.all.js': 1414046792583});
			store.set(state, function(err) {
				assert.isNull(err);
				var content = fs.readFileSync(stateFile, 'utf8');
				assert.equal(content, '{"1414046792583-set.all.js":1414046792583}');
				done();
			});
		});
		it('should return error if "localState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = LocalStateStore(project);
			var state = new MigratState({'1414046792583-set.all.js': 1414046792583});
			store.set(state, function(err, state) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /localState/);
				done();
			});
		});
	});
});