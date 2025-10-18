const templatesController = require('../controllers/templatesController');
const messagesController = require('../controllers/messagesController');
const usersController = require('../controllers/usersController');
const channelsController = require('../controllers/channelsController');
const profileController = require('../controllers/profileController');
const authController = require('../controllers/authController');

const router = app => {
    app.use('/', templatesController);
    app.use('/messages', messagesController);
    app.use('/users', usersController);
    app.use('/channels', channelsController);
    app.use('/profile', profileController);
    app.use('/auth', authController);
}

module.exports = router;