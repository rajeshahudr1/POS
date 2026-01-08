const router = require('express').Router();

router.get('/dashboard', (req, res) => {
    res.render('dashboard');
});
// router.get('/sizes', (req, res) => {
//     res.send('Size Master UI');
// });



module.exports = router;
