var movies = require('./index.js');

exports.command = "findmovies"; // the command

exports.desc = {
    params: "<string>", // parameters (shown in help)
    desc: "find movies by (a) keyword(s), release year or genre(s)", // command description (shown in help)
    needed: "allowed" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

exports.exec = function () {
    var term = raw.substring(this.command.length+1);

    movies.find(term, 5, function (error, rows) {
        if (error || rows.length < 1) {
            return chanMsg("Sorry, but I couldn't find any movies :(");
        }

        userMsg("{B}Movies according to your keywords (" + term + "):{R}");

        rows.forEach(function (movie) {
            userMsg(" - " + movies.format(movie));
        });
    });
};

