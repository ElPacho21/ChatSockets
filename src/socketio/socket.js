const { Server } = require('socket.io');
const { logger } = require('../utils/logger');
const Channel = require('../models/channel.model');
const Message = require('../models/message.model');
const registry = require('../utils/registry');

let io;

const socketio = (server) => {
    io = new Server(server);

    io.on('connection', (socket) => {
        logger.info(`Client ID: ${socket.id}`);

        // Identify user after HTTP login (client emits with user object)
        socket.on('identify', (user) => {
            if (user && user._id) {
                registry.setUser(user._id, socket.id, user);
                io.emit('userList', registry.listUsers());
            }
        });

        socket.on('createChannel', async (channelData) => {
            try {
                const channel = new Channel(channelData);
                await channel.save();
                io.emit('channelCreated', channel);
            } catch (error) {
                logger.error(error);
            }
        });

        // Join channel by ID to use as Socket.IO room
        socket.on('joinChannel', async (channelId) => {
            socket.join(String(channelId));
            const messages = await Message.find({ channel: channelId })
                .populate('sender', 'username profile.avatar')
                .sort({ timestamp: 1 })
                .limit(100)
                .lean();
            socket.emit('messageLogs', messages);
        });

        socket.on('message', async (data) => {
            try {
                const message = new Message(data);
                await message.save();
                const populatedMessage = await Message.findById(message._id).populate('sender', 'username profile.avatar').lean();
                if (data.channel) {
                    io.to(String(data.channel)).emit('messageLogs', [populatedMessage]);
                } else if (data.receiver) {
                    const receiverSocketId = registry.getSocketId(data.receiver);
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('messageLogs', [populatedMessage]);
                    }
                    // Also send to sender
                    io.to(socket.id).emit('messageLogs', [populatedMessage]);
                }
            } catch (error) {
                logger.error(error);
            }
        });
        
        socket.on('disconnect', () => {
            logger.info(`Client ID: ${socket.id} disconnected`);
            registry.removeSocket(socket.id);
            io.emit('userList', registry.listUsers());
        });
    });
};

const getIo = () => io;

module.exports = { socketio, getIo };