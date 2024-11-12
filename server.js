const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');

const app = express();

// Corrected paths for SSL certificate files
const options = {
  key: fs.readFileSync('cert/private-key.pem'),
  cert: fs.readFileSync('cert/certificate.pem'),
};

const server = https.createServer(options, app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('message', (message) => {
    io.emit('message', message);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(443, () => {
  console.log('Server running on https://anylove.org');
});
