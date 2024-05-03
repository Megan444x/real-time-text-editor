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

app.post('/api/authenticate', (req, res) => {
    const { username, password } = req.body;
    
    const isAuthenticated = username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD;
    
    if (isAuthenticated) {
        res.json({ success: true, token: "fake-jwt-token" });
    } else {
        res.status(401).json({ success: false, message: "Authentication failed" });
    }
});

app.post('/api/createDocument', (req, res) => {
    res.json({ success: true, message: "Document created successfully" });
});

app.put('/api/updateDocument/:id', (req, res) => {
    res.json({ success: true, message: "Document updated successfully" });
});

app.get('/api/documentHistory/:id', (req, res) => {
    res.json({ success: true, history: [] });
});

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('documentChange', (documentContent) => {
        console.log(documentContent);
        socket.broadcast.emit('documentUpdate', documentContent);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});