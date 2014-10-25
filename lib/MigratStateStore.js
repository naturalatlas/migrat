var _ = require('lodash');
var async = require('async');
var MigratState = require('./MigratState.js');

function MigratStateStore() {
	this._get = null;
	this._set = null;
}

MigratStateStore.get = function(callback) {
	this._get(function(err, serializedState) {
		var state;
		if (err) return callback(err);
		try { state = MigratState.unserialize(serializedState); }
		catch (e) { return callback(new Error('Unable to parse state')); }
		callback(null, state);
	});
};

MigratStateStore.set = function(state, callback) {
	if (!(state instanceof MigratState)) {
		return callback(new Error('State must be an instance of MigratState'));
	}

	var serializedState = state.serialize();
	this._set(project, serializedState, callback);
};

MigratStateStore.define = function(methods) {
	var store = new MigratStateStore();
	store._get = methods.get;
	store._set = methods.set;
	return store;
};

module.exports = MigratStateStore;