const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const authMiddleware = require('./middleware/auth');

const router = require('./routes/index');
const connectDB = require('./db/database');
const { logger, addLogger } = require('./utils/logger');
const { socketio } = require('./socketio/socket');
const initializePassport = require('./config/passport');

const port = 8080;

// Express App
const app = express();

// Database connection
connectDB();

// CookieParser

app.use(cookieParser())

// Passport
initializePassport()
app.use(passport.initialize())

// Logger
app.use(addLogger);

// Middleware Express
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());
app.use(authMiddleware.attachUser);
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
router(app);

// Handlebars View Engine
app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

const server = app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
})

// Sockets
socketio(server);