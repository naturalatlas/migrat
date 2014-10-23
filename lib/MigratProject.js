var _ = require('lodash');

function MigratProject(config) {
	_.extend(this, config);
}

module.exports = MigratProject;