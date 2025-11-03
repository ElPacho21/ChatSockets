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

        socket.on('joinChannel', (channelId) => {
            socket.join(String(channelId));
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