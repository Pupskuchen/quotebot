var movies = require("./module");

exports.command = "ratemovie";

exports.desc = {
    params: "<string> <integer:0-10>",
    desc: "rates a movie",
    needed: "allowed"
};

exports.exec = function () {
    var parts = raw.substring(this.command.length+1).split(" "),
        rating = parseFloat(parts.pop()),
        title = parts.join(" ");

    if (!title || !rating || isNaN(rating)) {
        return paramError("ratemovie <title> <rating>");
    }

    movies.rate(title, nick, rating, function (error, movie, vote) {
        if (error) {
            return chanMsg("Sorry, but I couldn't rate the movie (did you already rate it?) :(");
        }

        return chanMsg("Movie successfully rated with " + rating + " points!");
    });
};

