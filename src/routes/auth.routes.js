const router = require('express').Router();

// ✏️ Set your static credentials here
const ADMIN_EMAIL    = 'admin@ramzan.com';
const ADMIN_PASSWORD = 'admin@5986985';

// Show login page
router.get('/login', (req, res) => {
    if (req.session.loggedIn) return res.redirect('/admin/dashboard');
    res.render('login', { layout: false, error: null });
});

// Handle login form
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.loggedIn = true;
        req.session.email = email;
        return res.redirect('/admin/dashboard');
    }
    res.render('login', { layout: false, error: 'Invalid email or password' });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;