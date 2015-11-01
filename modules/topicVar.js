exports.command = "tvar";

exports.desc = {
	params: "<var> [<value>]",
	desc: "sets topic variable $var to $value or returns its value",
	needed: ""
};

var self = this;
c.tvar_allowedModes = c.tvar_allowedModes || "%@~";

exports.exec = function () {
	if (isAllowed()) {
		if (paramstringparam.length < 1 && params.length < 1) return paramError("tvar <var> <value>");
		paramstringparam = paramstringparam === "++" || paramstringparam === "--" ? paramstringparam : paramstringparam.replace(/[^\w :\/.äüöÄÜÖß\d]/g, '');
		params[0] = params[0].replace(/[^\w\d-äöüÄÖÜß.]/g, '');
		var chan = this.chan;
		var topic = client.getChannel(chan).getTopic().topic;
		var regex = /\s*([\w\d-äöüÄÖÜß.]+):\s+([\w :\/.äüöÄÜÖß\d]+)/g;
		var match = regex.exec(topic);
		var vars = {};
		while (match != null) {
			vars[match[1]] = match[2].trim();
			match = regex.exec(topic);
		}
		if (stringparam in vars) return chanMsg(stringparam+" = "+vars[stringparam]);
		else if (params[0] !== "unset" && paramstringparam.length < 1) {
			if (params[0] in vars) return chanMsg(params[0]+" = "+vars[params[0]]);
			else return chanMsg("no such topic variable");
		}
		else {
			if (params[0] === "unset") { // unset
				if (paramstringparam.length < 1) return paramError("tvar unset <var>");
				else if (!(paramstringparam in vars)) return chanMsg("no such topic variable");
				var reg = new RegExp("[\\s\\\|]+"+paramstringparam+":\\s+"+vars[paramstringparam], "g");
				client.topic(chan, topic.replace(reg, ''));
				return;
			}
			if (params[0] in vars) { // change
				if (paramstringparam === "++" || paramstringparam === "--") {
					if (isNaN(vars[params[0]])) return chanMsg("you cannot do that, silly");
				}
				client.topic(chan, topic.replace(params[0]+": "+vars[params[0]], params[0]+": "+(paramstringparam === "++" ? (parseInt(vars[params[0]])+1) : (paramstringparam === "--" ? (parseInt(vars[params[0]])-1) : paramstringparam))));
			} else { // create
				client.topic(chan, topic + ' | '+params[0]+': '+(paramstringparam === "++" ? 1 : paramstringparam === "--" ? -1 : paramstringparam));
			}
		}
	} else return permissionError();
};

function isAllowed () {
	for(var i = 0; i < c.tvar_allowedModes.length; i++) {
		if (self.user.channels[self.chan].indexOf(c.tvar_allowedModes[i]) != -1) return true;
	}
	return false;
}
