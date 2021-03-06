var movies = require("./module");

exports.command = "listmovies";

exports.desc = {
    params: "",
    desc: "lists all movies in the database",
    needed: "allowed"
};

exports.exec = function () {
    var page = parseInt(raw.substring(this.command.length+1));

    movies.list(page, function (error, rows, limit, total) {
        if (error || rows.length < 1) {
            return chanMsg("Sorry, but I couldn't find any movies :(");
        }

        userMsg("{B}Movies in our database, ordered by rating:{R}");

        rows.forEach(function (movie) {
            userMsg(" - " + movies.format(movie, true));
        });

        if (total > limit) {
            userMsg("Showing only " + rows.length + " of "  + total + " movies (" + limit + " movies per page). Use 'listmovies <page>' to show more.");
        }
    });
};

