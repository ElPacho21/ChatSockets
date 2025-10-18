const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: false },
    content: { type: String, required: false },
    file: {
        filename: String,
        path: String
    },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
