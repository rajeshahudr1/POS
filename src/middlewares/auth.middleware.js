module.exports = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
        return next();
    }
    return res.redirect('/login');
};