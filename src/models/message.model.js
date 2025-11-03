const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: false, index: true },
    content: { type: String, required: false },
    file: {
        filename: String,
        path: String
    },
    timestamp: { type: Date, default: Date.now, index: true }
});

messageSchema.index({ channel: 1, timestamp: 1 });
messageSchema.index({ sender: 1, receiver: 1, timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
