var hbs = require('express-hbs'),
	fs = require('fs'),
	partialPath = __dirname + '/views/partials',
	partials,
	name,
	partialList = {};

/**
 * Setup hbs partials
 */
partials = fs.readdirSync(partialPath);
partials.forEach(function(partial) {
  var file;
  name = /(.*)\.hbs/.exec(partial);
  console.log('name', name);
  if (name !== null) {
  	file = fs.readFileSync(partialPath + '/' + partial);
  	hbs.registerPartial(name[1], file);
  	partialList[name[1]] = encodeURIComponent(file);
  }
});

function Partials (config) {
	this.config = config;
}

Partials.prototype = {
	handle: function (req, res, next) {
		req.partials = partialList;
		next();
	}
};

module.exports = function (config) {
	return new Partials(config);
};
