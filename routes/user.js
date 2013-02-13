

exports.auth = function(req, res) {
  res.redirect('/');
};

// GET /auth/yahoo/return
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
exports.authReturn = function(req, res) {
    res.redirect('/');
};

exports.logout = function(req, res){
  req.logout();
  res.redirect('/');
};

exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
};