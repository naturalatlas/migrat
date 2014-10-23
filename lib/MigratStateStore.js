var MigratState = require('./MigratState.js');

function MigratStateStore(project) {
	_.extend(this, _.mapValues({
		'local': require('./StateStores/LocalStateStore.js'),
		'global': require('./StateStores/GlobalStateStore.js')
	}, function(store, callback) {
		return {
			get: function(callback) {
				store.get(project, function(err, serializedState) {
					var state;
					if (err) return callback(err);
					try { state = MigratState.unserialize(serializedState); }
					catch (e) { return callback(new Error('Unable to parse state')); }
					callback(null, state);
				});
			},
			set: function(state, callback) {
				if (!(state instanceof MigratState)) {
					return callback(new Error('State must be an instance of MigratState'));
				}

				var serializedState = state.serialize();
				store.set(project, serializedState, callback);
			}
		};
	}));
}

MigratStore.prototype.readState = function(callback) {
	async.auto({
		local: this.local.get.bind(this),
		global: this.global.get.bind(this),
	}, callback);
};