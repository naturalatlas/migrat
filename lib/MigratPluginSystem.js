var path = require('path');
var minimatch = require('minimatch');
var MigratStateStore = require('./MigratStateStore.js');

function MigratPluginSystem(plugins) {
	// initialize all plugins
	plugins = plugins || [];
	this.plugins = plugins.map(function(plugin) {
		var pluginState = new MigratPluginInterface();
		plugin(pluginState);
		return pluginState._state;
	});

	// check for conflicts
	// TODO: check for multiple state stores
	// TODO: check for multiple lockers
}

MigratPluginSystem.prototype.lock = function(callback, fallback) {
	for (var i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].locker) {
			return this.plugins[i].locker.lock(callback);
		}
	}
	fallback();
};

MigratPluginSystem.prototype.unlock = function(callback, fallback) {
	for (var i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].locker) {
			return this.plugins[i].locker.unlock(callback);
		}
	}
	fallback();
};

MigratPluginSystem.prototype.loadMigration = function(file, callback) {
	var filename = path.basename(file);
	var i, j, n, k, plugin, loaderfn;

	for (i = 0, n = this.plugins.length; i < n; i++) {
		plugin = this.plugins[i];
		for (j = 0, k = plugin.loaders.length; j < k; j++) {
			if (minimatch(filename, plugin.loaders[j].pattern)) {
				loaderfn = plugin.loaders[j].loader;
				break;
			}
		}
		if (loaderfn) break;
	}

	if (!loaderfn) return callback();
	loaderfn(file, callback);
};

MigratPluginSystem.prototype.getLocalStateStore = function() {
	for (var i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].localStore) {
			return MigratStateStore.define(this.plugins[i].localStore);
		}
	}
	return null;
};

MigratPluginSystem.prototype.getGlobalStateStore = function() {
	for (var i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].globalStore) {
			return MigratStateStore.define(this.plugins[i].globalStore);
		}
	}
	return null;
};

MigratPluginSystem.prototype.renderMigration = function(type, details, callback) {
	type = type.toLowerCase();
	var templateProvider;
	for (var i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].templates.hasOwnProperty(type)) {
			templateProvider = this.plugins[i].templates[type];
			break;
		}
	}
	if (!templateProvider) {
		return callback(new Error('No plugin found capable of creating "*.' + type + '" files'));
	}
	templateProvider(details, callback);
};

module.exports = MigratPluginSystem;