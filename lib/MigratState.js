var Time = require('./Time.js');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function key(migration) {
	return migration.filename.toLowerCase();
}

function MigratState() {
	this.state = {};
};

MigratState.prototype.serialize = function() {
	return JSON.stringify(this.state);
};

MigratState.unserialize = function(serializedState) {
	var state = new MigratState();
	state.state = JSON.parse(serializedState);
	return state;
};

MigratState.prototype.add = function(migration) {
	this.state[key(migration)] = Time.stamp();
	this.emit('change', this.serialize());
};

MigratState.prototype.remove = function(migration) {
	delete this.state[key(migration)];
	this.emit('change', this.serialize());
};

MigratState.prototype.exists = function(migration) {
	return this.state.hasOwnProperty(key(migration));
};

util.inherits(MigratState, EventEmitter);