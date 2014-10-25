function MigratPluginInterface() {
	this._state = {
		name: null,
		version: null,
		loaders: [],
		templates: {},
		localStore: null,
		globalStore: null,
		locker: null
	};
};

MigratPluginInterface.prototype.setPluginName = function(name) {
	this._state.name = name;
};

MigratPluginInterface.prototype.setPluginVersion = function(version) {
	this._state.version = version;
};

MigratPluginInterface.prototype.registerLoader = function(pattern, loader) {
	if (typeof loader !== 'function') {
		throw new Error('Attempted to register a loader that was not a function');
	}
	this._state.loaders.push({
		pattern: pattern,
		loader: loader
	});
};

MigratPluginInterface.prototype.registerTemplate = function(extension, templatefn) {
	if (typeof templatefn !== 'function') {
		throw new Error('Attempted to register a template function that wasn\'t a function');
	}
	extension = extension.replace(/^\./, '');
	this._state.templates[extension] = templatefn;
};

MigratPluginInterface.prototype.registerLocker = function(locker) {
	if (this._state.locker) {
		throw new Error('Plugin already has a locker registered');
	} else if (typeof locker.lock !== 'function') {
		throw new Error('Attempted to register a locker that doesn\'t have a "lock" method');
	} else if (typeof locker.unlock !== 'function') {
		throw new Error('Attempted to register a locker that doesn\'t have a "unlock" method');
	}
	this._state.locker = locker;
};

MigratPluginInterface.prototype.registerGlobalStateStore = function(store) {
	if (this._state.globalStore) {
		throw new Error('Plugin already has a global store registered');
	} else if (typeof store.get !== 'function') {
		throw new Error('Attempted to register a global store that doesn\'t have a "get" method');
	} else if (typeof store.set !== 'function') {
		throw new Error('Attempted to register a global store that doesn\'t have a "set" method');
	}
	this._state.globalStore = store;
};

MigratPluginInterface.prototype.registerLocalStateStore = function(store) {
	if (this._state.localStore) {
		throw new Error('Plugin already has a local store registered');
	} else if (typeof store.get !== 'function') {
		throw new Error('Attempted to register a local store that doesn\'t have a "get" method');
	} else if (typeof store.set !== 'function') {
		throw new Error('Attempted to register a local store that doesn\'t have a "set" method');
	}
	this._state.localStore = store;
};

module.exports = MigratPluginInterface;