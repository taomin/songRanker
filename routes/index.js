
exports.index = function(req, res){

    res.render('index', {
        title: 'Song Ranker',
        layout: 'layout',
        songs: req.songs,
        user: req.user,
        partials:  JSON.stringify({'songs': req.partials.songs, 'newsong': req.partials.newsong})
    });
};


exports.json = function (req, res) {
	res.render('json', {
		json: req.jsonResponse
	});
};