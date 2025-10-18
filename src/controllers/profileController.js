const { Router } = require('express');
const User = require('../models/user.model');
const upload = require('../utils/multer');

const router = Router();

// Render profile view
router.get('/', async (req, res) => {
    try {
        let { userId } = req.query;
        if (!userId && req.user?._id) userId = req.user._id;
        if (!userId) return res.status(400).send('userId required');
        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found');
        const u = user.toObject();
        if (!u.profile) u.profile = {};
    if (!u.profile.avatar) u.profile.avatar = '/img/default_avatar.svg';
        res.render('profile', { user: u });
    } catch (e) {
        res.status(500).send('Error loading profile');
    }
});

// Update profile
router.post('/', upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.body.userId || req.query.userId || (req.user && req.user._id);
        if (!userId) return res.status(400).send('userId required');
        const { firstName, lastName, password } = req.body;
        const update = {};
        if (typeof firstName !== 'undefined' && firstName !== '') update['profile.firstName'] = firstName;
        if (typeof lastName !== 'undefined' && lastName !== '') update['profile.lastName'] = lastName;
        if (password) update['password'] = password;
        if (req.file) {
            update['profile.avatar'] = `/uploads/${req.file.filename}`;
        }
        const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
        if (!user) return res.status(404).send('User not found');
        res.redirect('/');
    } catch (e) {
        res.status(500).send('Error updating profile');
    }
});

module.exports = router;
