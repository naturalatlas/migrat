var fs = require('fs');
var assert = require('chai').assert;
var MigratProject = require('../lib/MigratProject.js');
var MigratState = require('../lib/MigratState.js');
var MigratStateStore = require('../lib/MigratStateStore.js');
var MigratMigration = require('../lib/MigratMigration.js');
var MockMigratMigration = require('./mocks/MockMigration.js');

describe('MigratStateStore', function() {
	describe('.get()', function() {
		it('should return valid MigratState object if store returns empty response', function(done) {
			var store = MigratStateStore.define({
				set: function() {},
				get: function(callback) {
					return callback();
				}
			});
			store.get(function(err, state) {
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.equal(JSON.stringify(state.state), '{}');
				done();
			});
		});
		it('should return parse error if state is invalid', function(done) {
			var store = MigratStateStore.define({
				set: function() {},
				get: function(callback) {
					return callback(null, '!@OAIWFNAWIF!!@');
				}
			});
			store.get(function(err, state) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /Unable to parse/);
				done();
			});
		});
		it('should return valid MigratState object', function(done) {
			var store = MigratStateStore.define({
				set: function() {},
				get: function(callback) {
					return callback(null, '{"1413963352671-add-user-table.js":1413963352671}');
				}
			});
			store.get(function(err, state) {
				var migration = MockMigratMigration('1413963352671-add-user-table.js');
				assert.isNull(err);
				assert.instanceOf(state, MigratState);
				assert.isTrue(state.exists(migration));
				done();
			});
		});
	});

	describe('.set()', function() {
		it('should serialize state and behave as expected', function(done) {
			var setExecuted = false;
			var store = MigratStateStore.define({
				set: function(state, callback) {
					setExecuted = true;
					assert.equal(state, '{"1413963352671-add-user-table.js":1413963352671}');
					callback();
				},
				get: function() {}
			});

			var state = new MigratState({'1413963352671-add-user-table.js':1413963352671});
			store.set(state, function(err) {
				assert.isNull(err);
				assert.isTrue(setExecuted);
				done();
			});
		})
	});
});