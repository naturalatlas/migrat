var async = require('async');
var DefaultLocalStore = require('./DefaultStateStores/LocalStateStore.js');
var DefaultGlobalStore = require('./DefaultStateStores/GlobalStateStore.js');

/**
 * The bridge between the Migrat project and the
 * plugins loaded into it.
 *
 * @constructor
 * @param {MigratProject} project
 * @param {MigratPluginInterface} plugins
 */
function MigratProjectBridge(project, plugins) {
	this.project = project;
	this.plugins = plugins;
}

MigratProjectBridge.prototype.getLocalStateStore = function() {
	return this.plugins.getLocalStateStore() || DefaultLocalStore(this.project);
};

MigratProjectBridge.prototype.getGlobalStateStore = function() {
	return this.plugins.getGlobalStateStore() || DefaultGlobalStore(this.project);
};

MigratProjectBridge.prototype.getLockMethods = function() {
	return this.plugins.getLockMethods() || {lock: this.project.lock, unlock: this.project.unlock};
};

MigratProjectBridge.prototype.executeHook = function(hook, args) {
	var self = this;
	var callback = args.pop();
	if (typeof callback !== 'function') {
		throw new Error('Last argument passed to executeHook not a function');
	}

	async.series([
		function invokeConfigHook(callback) {
			if (!self.project) return callback();
			if (!self.project[hook]) return callback();
			self.project[hook].apply(null, args.concat([callback]));
		},
		function invokePluginHook(callback) {
			if (!self.plugins) return callback();
			self.plugins.executeHook(hook, args.concat([callback]));
		}
	], callback);
};

module.exports = MigratProjectBridge;