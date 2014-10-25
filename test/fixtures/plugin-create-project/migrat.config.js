module.exports = {
	plugins: [
		function(migrat) {
			migrat.registerTemplate('ext', function(details, callback) {
				callback(null, 'hello, ' + details.user);
			});
		}
	],
	localState: '../../temp/plugin-create-project.migratdb',
	migrationsDir: '../../temp',
	fetchState: function(callback) { callback(null, '{}'); },
	storeState: function(state, callback) { callback(); },
	migrationTemplate: function(details, callback) {
       callback(null, 'details:' + JSON.stringify(details));
    }
};