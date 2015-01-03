var movies = require('./index.js');

exports.command = "ratemovie"; // the command

exports.desc = {
    params: "<string> <integer:0-10>", // parameters (shown in help)
    desc: "rates a movie", // command description (shown in help)
    needed: "allowed" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
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
            console.log(error);
            return chanMsg("Sorry, but I couldn't rate the movie (did you already rate it?) :(");
        }

        return chanMsg("Movie successfully rated with " + rating + " points!");
    });
};

