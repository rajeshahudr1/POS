const router = require('express').Router();
const authMiddleware = require('../middlewares/auth.middleware');
router.use(authMiddleware);
router.get('/dashboard', (req, res) => {
    res.render('dashboard');
});
// router.get('/sizes', (req, res) => {
//     res.send('Size Master UI');
// });



module.exports = router;
