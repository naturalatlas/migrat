module.exports.options = {};

function enabled() {
	var options = module.exports.options;
	return !options.silent && !options.json;
}

module.exports.write = function(str) {
	if (enabled()) process.stdout.write(str);
};

module.exports.writeln = function(str) {
	module.exports.write(str + '\n');
};

module.exports.error = {};

module.exports.error.write = function(str) {
	if (enabled()) process.stderr.write(str);
};

module.exports.error.writeln = function(str) {
	module.exports.error.write(str + '\n');
};