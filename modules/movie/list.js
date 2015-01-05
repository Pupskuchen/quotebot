var movies = require('./index.js');

exports.command = "listmovies"; // the command

exports.desc = {
    params: "", // parameters (shown in help)
    desc: "lists all movies in the database", // command description (shown in help)
    needed: "allowed" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

exports.exec = function () {
    var page = parseInt(raw.substring(this.command.length+1));

    movies.list(page, function (error, rows) {
        if (error || rows.length < 1) {
            return chanMsg("Sorry, but I couldn't find any movies :(");
        }

        userMsg("{B}Movies in our database, ordered by rating:{R}");

        rows.forEach(function (movie) {
            userMsg(" - " + movies.format(movie, true));
        });
    });
};

