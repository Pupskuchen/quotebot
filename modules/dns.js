exports.command = "resolve";

exports.desc = {
	params: "<address>",
	desc: "resolves ipv4 and ipv6 entries of given address",
	needed: "owner"
};

var dns = require('dns');

exports.exec = function() {
  if(params.length < 1) return paramError("resolve <address>");
	dns.resolve4(params[0], function(err, addresses) {
		dns.resolve6(params[0], function(err6, add6) {
			chanMsg(params[0]+" resolved into IPV4: "+(addresses && addresses.length > 0 ? addresses.join(" | ") : "none")+", IPV6: "+(add6 && add6.length > 0 ? add6.join(" | ") : "none")+".");
		});
	});
};