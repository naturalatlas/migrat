var async = require('async');
var path = require('path');
var minimatch = require('minimatch');
var MigratStateStore = require('./MigratStateStore.js');
var MigratPluginInterface = require('./MigratPluginInterface.js');

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
};

MigratPluginSystem.prototype.executeHook = function(name, args) {
	var callback = args.pop();
	if (typeof callback !== 'function') {
		throw new Error('Last argument must be a callback');
	}

	var handlers = [];
	for (i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].hooks[name]) {
			handlers = handlers.concat(this.plugins[i].hooks[name]);
		}
	}

	async.eachSeries(handlers, function(handler, callback) {
		var _args = args.concat([callback]);
		handler.apply(null, _args);
	}, function(err) {
		callback(err || null);
	});
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

	if (!loaderfn) return callback(null, null);
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

MigratPluginSystem.prototype.getLockMethods = function() {
	for (var i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].locker) {
			return this.plugins[i].locker;
		}
	}
	return null;
};

MigratPluginSystem.prototype.getTemplateRenderer = function(type) {
	type = type.toLowerCase();
	for (var i = 0, n = this.plugins.length; i < n; i++) {
		if (this.plugins[i].templates.hasOwnProperty(type)) {
			return this.plugins[i].templates[type];
		}
	}
	return null;
};

module.exports = MigratPluginSystem;