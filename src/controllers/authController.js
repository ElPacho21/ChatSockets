const { Router } = require('express');

const router = Router();

router.get('/me', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = req.user.toObject ? req.user.toObject() : req.user;
    if (user.password) delete user.password;
    res.json(user);
});

router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    res.json({ ok: true });
});

module.exports = router;
