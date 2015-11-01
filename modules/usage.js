exports.command = "usage"; // the command

exports.desc = {
	params: "", // parameters (shown in help)
	desc: "prints memory usage", // command description (shown in help)
	needed: "allowed" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

function byteToMB(b) {
	return (b/1024/1024).toPrecision(4);
}

// to be executed on command
exports.exec = function() {
	var mU = process.memoryUsage();
	chanMsg('rss: '+byteToMB(mU.rss)+' MB, '+'heap total: '+byteToMB(mU.heapTotal)+' MB, heap used: '+byteToMB(mU.heapUsed)+' MB');
	mU = null;
};

/*
// "destructor"
exports.stop = function() {

};
*/
