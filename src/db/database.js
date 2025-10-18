const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://admin:Pachocrack21@clusterback.7s3qx.mongodb.net/ChatSockets?retryWrites=true&w=majority&appName=ClusterBack');
        logger.info('Base de datos conectada');
    } catch (error) {
        logger.error('Error al conectar a la base de datos', error);
        process.exit(1);
    }
};

module.exports = connectDB;
