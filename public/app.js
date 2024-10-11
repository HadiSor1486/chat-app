const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store messages in memory (temporary storage)
let messages = [];

// Handle incoming connections from clients
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Send existing messages to the newly connected user
    socket.emit('loadMessages', messages);

    // Listen for chat messages
    socket.on('chatMessage', (msg) => {
        messages.push(msg); // Store the message
        io.emit('chatMessage', msg); // Broadcast the message to all clients
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Set up server to listen on a specific port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
