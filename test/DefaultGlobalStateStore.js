var assert = require('chai').assert;
var MigratProject = require('../lib/MigratProject.js');
var MigratState = require('../lib/MigratState.js');
var MigratStateStore = require('../lib/MigratStateStore.js');
var MockMigratMigration = require('./mocks/MockMigration.js');
var GlobalStateStore = require('../lib/DefaultStateStores/GlobalStateStore.js');

describe('DefaultStateStores/GlobalStateStore', function() {
	it('should return an instance of MigratStateStore', function() {
		var project = new MigratProject({});
		var store = GlobalStateStore(project);
		assert.instanceOf(store, MigratStateStore);
	});
	describe('.get()', function() {
		it('should return proper MigratState object via fetchState', function(done) {
			var project = new MigratProject({
				fetchState: function(callback) {
					return callback(null, '{"1414046792583-get.js":1414046792583}')
				}
			});
			var store = GlobalStateStore(project);
			store.get(function(err, state) {
				var migration = MockMigratMigration('1414046792583-get.js');
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.isTrue(state.exists(migration));
				done();
			});
		});
		it('should return error if "fetchState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = GlobalStateStore(project);
			store.get(function(err, state) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /fetchState/);
				done();
			});
		});
	});
	describe('.set()', function() {
		it('should invoke storeState', function(done) {
			var invokedStore = false;
			var project = new MigratProject({
				storeState: function(serializedState, callback) {
					invokedStore = true;
					assert.equal(serializedState, '{"1414046792583-set.js":1414046792583}');
					callback();
				}
			});
			var store = GlobalStateStore(project);
			var state = new MigratState({'1414046792583-set.js': 1414046792583});
			store.set(state, function(err) {
				assert.isNull(err);
				assert.isTrue(invokedStore);
				done();
			});
		});
		it('should return error if "storeState" not defined in project config', function(done) {
			var project = new MigratProject({});
			var store = GlobalStateStore(project);
			var state = new MigratState({'1414046792583-set.js': 1414046792583});
			store.set(state, function(err) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /storeState/);
				done();
			});
		});
	});
});