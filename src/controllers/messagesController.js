const { Router } = require('express');
const Message = require('../models/message.model');
const upload = require('../utils/multer');
const { getIo } = require('../socketio/socket');
const registry = require('../utils/registry');

const router = Router();

// Get channel history
router.get('/channel/:channelId', async (req, res) => {
    try {
        const { channelId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const messages = await Message.find({ channel: channelId })
            .populate('sender', 'username profile.avatar')
            .sort({ timestamp: 1 })
            .limit(limit)
            .lean();
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch channel messages' });
    }
});

// Get private history between two users
router.get('/private', async (req, res) => {
    try {
        const { me, user } = req.query;
        if (!me || !user) return res.status(400).json({ error: 'me and user are required' });
        const limit = parseInt(req.query.limit) || 100;
        const messages = await Message.find({
            $or: [
                { sender: me, receiver: user },
                { sender: user, receiver: me },
            ]
        })
        .populate('sender', 'username profile.avatar')
        .sort({ timestamp: 1 })
        .limit(limit)
        .lean();
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch private messages' });
    }
});

// Get contacts (distinct users who have chatted with me)
router.get('/contacts', async (req, res) => {
    try {
        const { me } = req.query;
        if (!me) return res.status(400).json({ error: 'me is required' });
        const agg = await Message.aggregate([
            { $match: { $or: [ { sender: new (require('mongoose').Types.ObjectId)(me) }, { receiver: new (require('mongoose').Types.ObjectId)(me) } ] } },
            { $project: {
                other: {
                    $cond: [ { $eq: ['$sender', new (require('mongoose').Types.ObjectId)(me)] }, '$receiver', '$sender' ]
                }
            } },
            { $match: { other: { $ne: null } } },
            { $group: { _id: '$other' } }
        ]);
        const ids = agg.map(x => x._id);
        const users = await require('../models/user.model').find({ _id: { $in: ids } }).select('-password').lean();
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { receiver, channel, senderId, content } = req.body;
        const file = {
            filename: req.file.filename,
            path: req.file.path
        };

        const messageData = {
            sender: senderId,
            content: content || undefined,
            file
        };

        if (channel) {
            messageData.channel = channel;
        } else if (receiver) {
            messageData.receiver = receiver;
        }

        const message = new Message(messageData);
        await message.save();
        const populatedMessage = await Message.findById(message._id).populate('sender', 'username profile.avatar').lean();

        const io = getIo();
        if (channel) {
            io.to(String(channel)).emit('messageLogs', [populatedMessage]);
        } else if (receiver) {
            const receiverSocketId = registry.getSocketId(receiver);
            if (receiverSocketId) io.to(receiverSocketId).emit('messageLogs', [populatedMessage]);
            
            const senderSocketId = registry.getSocketId(senderId);
            if (senderSocketId) io.to(senderSocketId).emit('messageLogs', [populatedMessage]);
        }
        res.status(200).json({ message: 'File uploaded', file: populatedMessage });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Upload failed' });
    }
});

module.exports = router;