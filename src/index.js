const express = require('express');
const router = require('./routes/index');
const handlebars = require('express-handlebars');
const { Server } = require('socket.io');

const port = 8080;
let messages = [];

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(__dirname + '/public'));

router(app);

app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

const io = new Server(server);

io.on('connection', (socket) => {
    console.log(`Client ID: ${socket.id}`)

    socket.on('newUser', user => {
        socket.broadcast.emit('userConnected', user);
        socket.emit('messsageLogs', messages)
    })

    socket.on('message', data => {
        messages.push(data);
        io.emit('messageLogs', messages); //Se envian los mensajes para actualizar el render
    })
})