const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const dotenv = require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.DB_URI}`, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info('Base de datos conectada');
    } catch (error) {
        logger.error('Error al conectar a la base de datos', error);
        process.exit(1);
    }
};

module.exports = connectDB;
