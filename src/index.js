import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import chalk from 'chalk';

import UserUtility from './utils/users.js';

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory


const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

let count = 0;
//establish websocket connection
io.on('connection', (socket) => {
    console.log(chalk.blue('New WebSocket Connection'));

    //recieved messages from the client:
    socket.on('join', ({ displayName, room }, callback) => {
        const { error, user } = UserUtility.addUser({ id: socket.id, displayName, room });
        if (error) {
            return callback(error);
        }
        socket.join(room.toLowerCase());

        // send message to the client:
        socket.emit('system_message', {
            message: 'Welcome to the chat!',
            date: new Date().getTime()
        });

        socket.broadcast.to(room).emit('system_message', {
            message: `${displayName} has joined the room!`,
            date: new Date().getTime()
        });

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: UserUtility.getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on('sendMessage', (msg, callback) => {
        // send message to the client (single client):
        // socket.emit('countUpdated', msg);

        // send message to all connected clients:
        //io.emit('message', msg);

        const user = UserUtility.getUser(socket.id);
        // broadcast message to all clients except the current user:
        socket.broadcast.to(user.room).emit('message', {
            sender: 'other',
            displayName: user.displayName,
            type: 'text',
            msg: msg,
            date: new Date().getTime()
        });

        socket.emit('message', {
            sender: 'me',
            displayName: user.displayName,
            type: 'text',
            msg: msg,
            date: new Date().getTime()
        });
        callback();
    });

    //recieved messages from the client:
    socket.on('sendLocation', (obj) => {
        const user = UserUtility.getUser(socket.id);
        const googleMapsAPIPath = `https://google.com/maps?q=${obj.latitude},${obj.longitude}`;
        let oMessage = {
            url: googleMapsAPIPath,
            type: 'location',
            sender: 'other',
            displayName: user.displayName,
            date: new Date().getTime()
        }
        socket.broadcast.to(user.room).emit('location', oMessage);
        oMessage.sender = 'me';
        socket.emit('location', oMessage);
    });

    //websocket disconnect:
    socket.on('disconnect', () => {
        const user = UserUtility.removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('system_message', {
                message: `${user.displayName} has left!`,
                date: new Date().getTime()
            });
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: UserUtility.getUsersInRoom(user.room)
            });
        }

    });

});

server.listen(port, () => {
    console.log(chalk.inverse.green(`Server is running on port ${port}.`));
});
