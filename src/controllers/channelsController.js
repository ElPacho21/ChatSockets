const { Router } = require('express');
const Channel = require('../models/channel.model');
const User = require('../models/user.model');

const router = Router();

router.get('/', async (req, res) => {
    try {
        const channels = await Channel.find();
        res.json(channels);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

router.post('/join/:channelId', async (req, res) => {
    const { channelId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    try {
        await Channel.findByIdAndUpdate(channelId, { $addToSet: { users: userId } });
        const updatedUser = await User.findByIdAndUpdate(userId, { $addToSet: { channels: channelId } }, { new: true }).populate('channels');
        res.json(updatedUser);
    } catch (e) {
        res.status(500).json({ error: 'Failed to join channel' });
    }
});

module.exports = router;
