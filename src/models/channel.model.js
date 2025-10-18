const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
