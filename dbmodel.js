var mongoskin = require('mongoskin'),
    request = require('request'),
    db;

function SongDao (dburi){
    db = this.db = mongoskin.db(dburi);
}

SongDao.prototype = {
    getSongRanking: function(req, res, next){

        // fetch all songs
        db.collection('songs').find().sort('vote', -1).toArray(function (err, result){
            if (err) {
                return next(new Error("Couldn't connect to database: " + err));
            }
            var songHash = {};


            // fetch songs that this user voted
            if (req.user) {
                result.forEach(function(song){
                    songHash[song.spotify_link] = song;
                });

                db.collection('vote').find({'email': req.user.email}).toArray(function(err2, voteHistory){
                    if (err2) {
                        return next(new Error("Couldn't connect to database: " + err2));
                    }

                    voteHistory.forEach(function(history){
                        // history.spotify_link
                        if ( songHash[history.spotify_link] ) {
                            songHash[history.spotify_link]['disabled'] = true;
                        }
                    });

                    req.songs = result;
                    next();
                });

            } else {
                req.songs = result;
                next();
            }



        });
    },

    addSong: function(req, res, next){
        var song = JSON.parse(req.body.song);
        db.collection('songs').save(song);
        req.jsonResponse = '{"status": "OK"}';
        next();
    },

    voteSong: function(req, res, next){
        var cfg = req.body;
        cfg.vote = parseInt(cfg.vote);
        console.log('get voting:', cfg);
        db.collection('vote').save(cfg);
        db.collection('songs').findAndModify({'spotify_link': cfg.spotify_link}, {vote: -1}, {$inc:{'vote': cfg.vote}}, function(err, result){
            if (err) {
                return next(new Error("Couldn't connect to database: " + err));
            }
            req.jsonResponse = '{"status": "OK"}';
            next();
        });
    }

};


exports.init = function(dburi){
    var dao = new SongDao(dburi);
    return dao;
};


