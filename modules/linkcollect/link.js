var links = require('./module');

exports.command = "link";

exports.desc = {
  params: "[<id>]",
  desc: "gives you either the specified or a random link",
  needed: "allowed"
};

exports.exec = function() {
  var id = (params.length > 0 && !isNaN(parseInt(params[0]))) ? parseInt(params[0]) : null;

  links.get(id, function (err, link) {
    if(err || typeof link === "undefined") return chanMsg("nothing found");
    return chanMsg(links.format(link));
  });
};