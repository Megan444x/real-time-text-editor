const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(bodyParser.json());
app.use(express.static('public'));
app.post('/api/auth', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, token: "fake-jwt-token" });
    } else {
        res.status(401).json({ success: false, message: "Authentication failed"});
    }
});
app.post('/api/document', (req, res) => {
    res.json({ success: true, message: "Document created successfully" });
});
app.put('/api/document/:id', (req, res) => {
    res.json({ success: true, message: "Document updated successfully" });
});
app.get('/api/document/:id/history', (req, res) => {
    res.json({ success: true, history: [] });
});
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('documentChange', (doc) => {
        console.log(doc);
        socket.broadcast.emit('documentUpdate', doc);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});