const { verify } = require('../utils/jwt');
const User = require('../models/user.model');

async function attachUser(req, res, next) {
    const token = req.cookies?.token;
    if (!token) return next();
    const decoded = verify(token);
    if (!decoded) return next();
    try {
        const user = await User.findById(decoded.id).populate('channels');
        if (user) req.user = user;
    } catch (_) {}
    next();
}

module.exports = { attachUser };
