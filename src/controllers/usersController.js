const { Router } = require('express');
const User = require('../models/user.model');
const Channel = require('../models/channel.model');
const { logger } = require('../utils/logger');

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;
        
        const data = {
            username,
            password,
            profile: { firstName, lastName, avatar: '/img/default_avatar.svg' },
        };
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        const user = await User.create(data);
        return res.status(201).json(user);
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const populated = await User.findById(user._id).populate('channels');
        
        const { sign } = require('../utils/jwt');
        const token = sign({ id: populated._id });
        res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7*24*60*60*1000 });
        return res.json(populated);
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.get('/', async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
});

module.exports = router;