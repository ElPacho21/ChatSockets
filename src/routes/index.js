const templatesController = require('../templates/templatesController');

const router = app => {
    app.use('/', templatesController);
}

module.exports = router;