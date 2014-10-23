module.exports.options = {};

module.exports.write = function(str) {
	var options = module.exports.options;
	var enable = !options.silent && !options.json;
	if (enable) process.stdout.write(str);
};