var offset = 0;

module.exports.stamp = function() {
	return (new Date).getTime() + offset;
};

module.exports.synchronize = function(callback) {
	// TODO: set offset from ntp
	callback();
};