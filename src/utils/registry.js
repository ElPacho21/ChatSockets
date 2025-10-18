// Simple in-memory registry of connected users
// Maps: userId -> { socketId, user }
// and reverse socketId -> userId

const userIdToConn = new Map();
const socketIdToUserId = new Map();

function setUser(userId, socketId, user) {
    userIdToConn.set(String(userId), { socketId, user });
    socketIdToUserId.set(String(socketId), String(userId));
}

function getSocketId(userId) {
    const entry = userIdToConn.get(String(userId));
    return entry ? entry.socketId : null;
}

function listUsers() {
    return Array.from(userIdToConn.values()).map(v => v.user);
}

function removeSocket(socketId) {
    const userId = socketIdToUserId.get(String(socketId));
    if (userId) {
        userIdToConn.delete(userId);
        socketIdToUserId.delete(String(socketId));
    }
}

module.exports = {
    setUser,
    getSocketId,
    listUsers,
    removeSocket,
};
