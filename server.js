const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const authCache = {};

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/authenticate', (req, res) => {
    const { username, password } = req.body;
    
    const cacheKey = `${username}-${password}`;
    
    if (authCache[cacheKey] !== undefined) {
        return res.json(authCache[cacheKey]);
    }
    
    const isAuthenticated = username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD;
    
    const response = isAuthenticated ? { success: true, token: "fake-jwt-token" } : { success: false, message: "Authentication failed" };
    
    authCache[cacheKey] = response;
    
    res.json(response);
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