const { Router } = require('express');

const router = Router();

router.get('/login', (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('login.handlebars', {});
});

router.get('/', (req, res) => {
    if (!req.user) return res.redirect('/login');
    res.render('chat.handlebars', {});
});

module.exports = router;